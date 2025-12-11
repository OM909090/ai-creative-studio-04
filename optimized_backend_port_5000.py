#!/usr/bin/env python3
"""
Optimized Multi-Threaded Video Processing Backend Manager (Cleanup Added)
=======================================================================
Target: < 60 seconds for 10-minute videos
Port: 5000 (Seamless Frontend Integration)
"""

import os
import json
import subprocess
import logging
import time
import math
import psutil
import threading
import shutil # Added for directory cleanup
from typing import List, Dict, Tuple, Optional, Callable
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, field
from enum import Enum
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('optimized_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Thread-safe progress lock
progress_lock = threading.Lock()

# Global Progress State
progress_state = {
    'status': 'idle',
    'message': '',
    'progress': 0,
    'error': None,
    'threads_used': 0,
    'estimated_time_remaining': 0,
    'elapsed_time': 0,
    'total_clips': 0,
    'current_clip': 0
}

def update_progress(status: str, message: str, progress: int, **kwargs):
    """Updates the global progress state with thread safety."""
    with progress_lock:
        progress_state.update({
            'status': status,
            'message': message,
            'progress': progress
        })
        for key, value in kwargs.items():
            progress_state[key] = value
            
        logger.info(f"Progress: {progress}% - {message}")

class ProcessingPriority(Enum):
    LOW = 3
    MEDIUM = 2
    HIGH = 1
    CRITICAL = 0

@dataclass(order=True)
class ProcessingTask:
    priority: int
    segment: Dict = field(compare=False)
    output_path: str = field(compare=False)
    output_filename: str = field(compare=False)
    video_path: str = field(compare=False)
    task_id: str = field(compare=False)
    timestamp: float = field(default_factory=time.time, compare=False)

class SystemMonitor:
    def __init__(self):
        self.cpu_count = psutil.cpu_count(logical=True)
        self.memory_gb = psutil.virtual_memory().total / (1024**3)
        self.max_workers = min(16, (self.cpu_count or 1) + 2)
        
    def get_optimal_worker_count(self, task_count: int) -> int:
        cpu_based = max(1, self.cpu_count - 2)
        available_mem = max(1, self.memory_gb - 2)
        memory_based = int(available_mem / 0.5)
        cpu_percent = psutil.cpu_percent(interval=0.1)
        if cpu_percent > 80:
            cpu_based = max(1, cpu_based // 2)
        optimal = min(cpu_based, memory_based, self.max_workers)
        return max(1, min(optimal, task_count))

class Config:
    DOWNLOAD_DIR = "downloads"
    OUTPUT_DIR = "all_30sec_shorts"
    CLIP_DURATION = 30
    MIN_CLIP_DURATION = 15
    MAX_CLIPS_PER_VIDEO = 100
    MAX_CONCURRENT_DOWNLOADS = 4
    HTTP_CHUNK_SIZE = 10485760
    MAX_RETRIES = 5

# Ensure directories exist
os.makedirs(Config.DOWNLOAD_DIR, exist_ok=True)
os.makedirs(Config.OUTPUT_DIR, exist_ok=True)

class OptimizedVideoProcessor:
    def __init__(self):
        self.system_monitor = SystemMonitor()
    
    def download_video(self, url: str) -> Tuple[str, str, Dict]:
        logger.info(f"Downloading video: {url}")
        start_dl_time = time.time()

        def progress_hook(d):
            if d['status'] == 'downloading':
                try:
                    p = d.get('_percent_str', '0%').replace('%','')
                    percentage = float(p)
                    overall_progress = int(percentage * 0.3)
                    elapsed = int(time.time() - start_dl_time)
                    update_progress(
                        'downloading', 
                        f'Downloading: {percentage:.1f}%', 
                        overall_progress,
                        elapsed_time=elapsed
                    )
                except:
                    pass
            elif d['status'] == 'finished':
                update_progress('downloading', 'Download complete, processing...', 30)

        ydl_opts = {
            'format': 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]',
            'outtmpl': f'{Config.DOWNLOAD_DIR}/%(id)s.%(ext)s',
            'quiet': True,
            'progress_hooks': [progress_hook],
            'retries': Config.MAX_RETRIES,
            'fragment_retries': Config.MAX_RETRIES,
            'concurrent_fragment_downloads': Config.MAX_CONCURRENT_DOWNLOADS,
            'http_chunk_size': Config.HTTP_CHUNK_SIZE,
            'no_warnings': True,
            'writethumbnail': False,
            'writesubtitles': False,
            'socket_timeout': 30,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                video_path = ydl.prepare_filename(info)
                metadata = {
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'uploader': info.get('uploader', 'Unknown'),
                    'id': info.get('id')
                }
                return video_path, metadata['title'], metadata
        except Exception as e:
            logger.error(f"Download failed: {e}")
            raise Exception(f"Download failed: {str(e)}")

    def get_video_info_ffprobe(self, video_path: str) -> Dict:
        cmd = [
            'ffprobe', '-v', 'error', '-select_streams', 'v:0', 
            '-show_entries', 'stream=width,height,r_frame_rate,duration', 
            '-of', 'json', video_path
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            data = json.loads(result.stdout)
            stream = data['streams'][0]
            fps_str = stream.get('r_frame_rate', '30/1')
            num, den = map(int, fps_str.split('/'))
            fps = num / den if den != 0 else 30
            return {
                'duration': float(stream.get('duration', 0)),
                'resolution': (int(stream.get('width', 0)), int(stream.get('height', 0))),
                'fps': fps
            }
        except Exception as e:
            return {'duration': 0, 'resolution': (0,0), 'fps': 30}


    def calculate_optimal_segments(self, video_duration: int) -> List[Dict]:
        segments = []
        # Strictly enforce 30-second duration
        segment_duration = Config.CLIP_DURATION  # Always 30 seconds
        overlap = 5  # Fixed 5-second overlap
            
        step_size = segment_duration - overlap
        start_time = 0
        clip_count = 0
        
        while start_time < video_duration and clip_count < Config.MAX_CLIPS_PER_VIDEO:
            end_time = min(start_time + segment_duration, video_duration)
            
            # Only generate if the resulting clip is at least the minimum duration
            if (end_time - start_time) >= Config.MIN_CLIP_DURATION:
                segments.append({
                    'start_time': start_time,
                    'end_time': end_time,
                    'duration': end_time - start_time,
                    'clip_number': clip_count + 1,
                    'priority': ProcessingPriority.HIGH.value if clip_count < 3 else ProcessingPriority.MEDIUM.value
                })
            
            # Break if we've reached the end of the video
            if end_time >= video_duration:
                break
                
            start_time += step_size
            clip_count += 1
        return segments

    @staticmethod
    def _create_optimized_clip(task: ProcessingTask) -> bool:
        try:
            cmd = [
                'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
                '-ss', str(task.segment['start_time']),
                '-i', task.video_path,
                '-t', str(task.segment['duration']),
                '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
                '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                '-threads', '1',
                '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
                task.output_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
            return result.returncode == 0 and os.path.exists(task.output_path)
        except Exception:
            return False

    def create_clips_parallel(self, video_path: str, title: str, segments: List[Dict]) -> List[Dict]:
        clean_title = "".join([c if c.isalnum() else "_" for c in title])[:50]
        tasks = []
        for i, segment in enumerate(segments):
            filename = f"{clean_title}_clip_{segment['clip_number']:03d}.mp4"
            output_path = os.path.join(Config.OUTPUT_DIR, filename)
            tasks.append(ProcessingTask(
                priority=segment['priority'], segment=segment,
                output_path=output_path, output_filename=filename,
                video_path=video_path, task_id=f"task_{i}"
            ))
            
        num_workers = self.system_monitor.get_optimal_worker_count(len(tasks))
        logger.info(f"Processing {len(tasks)} clips with {num_workers} workers")
        
        update_progress('processing', 'Starting parallel processing...', 35, 
                        total_clips=len(tasks), current_clip=0, threads_used=num_workers)

        created_clips = []
        completed = 0
        tasks.sort()
        start_process_time = time.time()

        with ProcessPoolExecutor(max_workers=num_workers) as executor:
            future_to_task = {executor.submit(self._create_optimized_clip, t): t for t in tasks}
            
            for future in as_completed(future_to_task):
                task = future_to_task[future]
                completed += 1
                
                now = time.time()
                elapsed_since_start = now - start_process_time
                avg_time_per_clip = elapsed_since_start / completed
                remaining_clips = len(tasks) - completed
                eta = int(avg_time_per_clip * remaining_clips)
                
                try:
                    if future.result():
                        created_clips.append({
                            'path': task.output_path,
                            'filename': task.output_filename,
                            'duration': task.segment['duration'],
                            'size_mb': os.path.getsize(task.output_path) / (1024 * 1024),
                            'clip_number': task.segment['clip_number'],
                            'start_time': task.segment['start_time'],
                            'end_time': task.segment['end_time']
                        })
                except Exception:
                    pass
                
                progress_pct = 35 + int((completed / len(tasks)) * 60)
                update_progress(
                    'processing', f'Processing clip {completed}/{len(tasks)}', progress_pct,
                    current_clip=completed, total_clips=len(tasks),
                    threads_used=num_workers, estimated_time_remaining=eta,
                    elapsed_time=int(elapsed_since_start)
                )

        return created_clips

    def process_video(self, url: str) -> Dict:
        start_total_time = time.time()
        update_progress('starting', 'Initializing...', 0, 
                        total_clips=0, current_clip=0, threads_used=0, estimated_time_remaining=0)
        
        video_path, title, metadata = self.download_video(url)
        
        update_progress('analyzing', 'Analyzing video structure...', 32)
        analysis = self.get_video_info_ffprobe(video_path)
        metadata.update(analysis)
        
        update_progress('analyzing', 'Calculating optimal segments...', 34)
        segments = self.calculate_optimal_segments(analysis['duration'])
        
        created_clips = self.create_clips_parallel(video_path, title, segments)
        
        # Keep the source video until explicit cleanup if needed, or delete here
        # Currently deleting to save space as per original logic
        try:
            if os.path.exists(video_path): os.remove(video_path)
        except: pass

        total_time = time.time() - start_total_time
        update_progress('complete', 'Processing complete!', 100, estimated_time_remaining=0)
        
        return {
            'processing_metrics': {
                'total_time': total_time,
                'clips_created': len(created_clips),
                'fps_processed': len(created_clips) / (total_time / 60) if total_time > 0 else 0
            },
            'clip_details': created_clips,
            'original_metadata': metadata
        }

# Flask App
app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'version': '4.5-cleanup'}), 200

@app.route('/progress', methods=['GET'])
def get_progress():
    with progress_lock:
        return jsonify(progress_state)


@app.route('/cleanup', methods=['POST'])
def cleanup_data():
    """
    Deletes all files in the download and output directories.
    Resets progress state.
    """
    try:
        # Clear Downloads
        if os.path.exists(Config.DOWNLOAD_DIR):
            shutil.rmtree(Config.DOWNLOAD_DIR)
            os.makedirs(Config.DOWNLOAD_DIR)
            
        # Clear Outputs
        if os.path.exists(Config.OUTPUT_DIR):
            shutil.rmtree(Config.OUTPUT_DIR)
            os.makedirs(Config.OUTPUT_DIR)
            
        # Reset Progress
        update_progress('idle', 'Ready', 0, 
                        total_clips=0, current_clip=0, 
                        threads_used=0, estimated_time_remaining=0,
                        elapsed_time=0)
        
        logger.info("Cleanup completed successfully.")
        return jsonify({'success': True, 'message': 'All data cleaned up successfully.'})
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/generate_shorts', methods=['POST'])
def generate_shorts():
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
            
        processor = OptimizedVideoProcessor()
        report = processor.process_video(data['url'])
        
        return jsonify(report)
        
    except Exception as e:
        logger.error(f"API Error: {e}")
        update_progress('error', str(e), 0)
        return jsonify({'error': str(e)}), 500

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory(Config.OUTPUT_DIR, filename)

if __name__ == "__main__":
    # Startup Cleanup
    for d in [Config.DOWNLOAD_DIR, Config.OUTPUT_DIR]:
        if os.path.exists(d):
            try: shutil.rmtree(d) 
            except: pass
            os.makedirs(d)
            
    print("🚀 Fixed Optimized Backend (With Cleanup) Running on Port 5000")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)