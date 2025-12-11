import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api';
import {
  Wand2,
  Upload,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Scissors,
  Palette,
  Type,
  Music,
  Layers,
  Clock,
  RotateCcw,
  ArrowLeft,
  Link2,
  Sun,
  Contrast,
  Droplets,
  Thermometer,
  Sparkles,
  Zap,
  Crop,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Move,
  ZoomIn,
  ZoomOut,
  ImagePlus,
  SlidersHorizontal,
  Gauge,
  Film,
  MonitorPlay,
  Subtitles,
  Mic,

  VolumeOff,
  Waves,
  Loader2,
  PlayCircle,
  Minimize2,

  Youtube,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShortsShowcase, GeneratedShort } from './ShortsShowcase';
import { VideoAIAssistant } from './VideoAIAssistant';

interface ClipDetail {
  clip_number: number;
  start_time: number;
  end_time: number;
  duration: number;
  filename: string;
  size_mb: number;
}

interface VideoState {
  src: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  trimStart: number;
  trimEnd: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  zoom: number;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    temperature: number;
    blur: number;
    sharpen: number;
    vignette: number;
    grain: number;
  };
  effects: {
    fadeIn: number;
    fadeOut: number;
    slowMo: boolean;
    reverse: boolean;
    stabilize: boolean;
  };
  audio: {
    noiseReduction: number;
    bassBoost: number;
    trebleBoost: number;
    normalize: boolean;
  };
}

const exportQualities = [
  { value: '2160', label: '4K Ultra HD (2160p)' },
  { value: '1440', label: '2K QHD (1440p)' },
  { value: '1080', label: 'Full HD (1080p)' },
  { value: '720', label: 'HD (720p)' },
  { value: '480', label: 'SD (480p)' },
];

const videoFilters = [
  { id: 'none', name: 'None', filter: '' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(0.4) contrast(1.1)' },
  { id: 'noir', name: 'Noir', filter: 'grayscale(1) contrast(1.2)' },
  { id: 'vivid', name: 'Vivid', filter: 'saturate(1.5) contrast(1.1)' },
  { id: 'cool', name: 'Cool', filter: 'hue-rotate(20deg) saturate(0.9)' },
  { id: 'warm', name: 'Warm', filter: 'sepia(0.2) saturate(1.2)' },
  { id: 'dramatic', name: 'Dramatic', filter: 'contrast(1.3) brightness(0.9)' },
  { id: 'fade', name: 'Fade', filter: 'contrast(0.9) brightness(1.1) saturate(0.8)' },
];

export function VideoEditorLayout() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [exportQuality, setExportQuality] = useState('1080');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [activeFilter, setActiveFilter] = useState('none');
  const [isYoutubeImporting, setIsYoutubeImporting] = useState(false);
  const [isGeneratingShorts, setIsGeneratingShorts] = useState(false);
  const [generatedShorts, setGeneratedShorts] = useState<GeneratedShort[]>([]);
  const [importSource, setImportSource] = useState<'local' | 'youtube' | null>(null);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);


  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProgressMinimized, setIsProgressMinimized] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    percentage: 0,
    message: '',
    threadsUsed: 0,
    estimatedTimeRemaining: 0,
    elapsedTime: 0,
    totalClips: 0,
    currentClip: 0,
  });

  // Default demo video URL (using a sample video)
  const defaultDemoVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const [videoState, setVideoState] = useState<VideoState>({
    src: defaultDemoVideo,
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    trimStart: 0,
    trimEnd: 100,
    rotation: 0,
    flipH: false,
    flipV: false,
    zoom: 100,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      blur: 0,
      sharpen: 0,
      vignette: 0,
      grain: 0,
    },
    effects: {
      fadeIn: 0,
      fadeOut: 0,
      slowMo: false,
      reverse: false,
      stabilize: false,
    },
    audio: {
      noiseReduction: 0,
      bassBoost: 0,
      trebleBoost: 0,
      normalize: false,
    },
  });

  // Autoplay demo video on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoRef.current && videoState.src === defaultDemoVideo) {
        videoRef.current.play().catch(() => {
          // Autoplay might be blocked by browser, that's okay
          console.log('Autoplay was prevented');
        });
        setVideoState((prev) => ({ ...prev, isPlaying: true }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoState((prev) => ({ ...prev, src: url }));
      setImportSource('local');
      setGeneratedShorts([]);
      toast.success('Video loaded successfully!');
    }
  };

  const handleYoutubeImport = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    // Validate YouTube URL
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/;
    if (!ytRegex.test(youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setIsYoutubeImporting(true);
    toast.info('Importing video from YouTube...');

    // Simulate import process
    setTimeout(() => {
      setVideoState((prev) => ({
        ...prev,
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      }));
      setImportSource('youtube');
      setIsYoutubeImporting(false);
      toast.success('YouTube video imported successfully!');

      // Auto-trigger shorts generation for YouTube imports
      generateShorts();
    }, 2000);
  };

  const generateShorts = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL first');
      return;
    }

    setIsGeneratingShorts(true);


    // Reset progress state at the start
    setIsProgressMinimized(false);
    setGenerationProgress({
      percentage: 0,
      message: 'Initializing...',
      threadsUsed: 0,
      estimatedTimeRemaining: 0,
      elapsedTime: 0,
      totalClips: 0,
      currentClip: 0,
    });

    // Start polling for progress updates
    let progressToastId: string | number | undefined;
    let pollInterval: NodeJS.Timeout | null = null;

    const pollProgress = async () => {
      try {
        const result = await apiService.getProgress();

        if (!result.success) {
          console.error('Progress endpoint error:', result.error);
          return;
        }

        const progress = result.data;

        // Update progress state
        setGenerationProgress({
          percentage: progress.progress || 0,
          message: progress.message || 'Processing...',
          threadsUsed: progress.threads_used || 0,
          estimatedTimeRemaining: progress.estimated_time_remaining || 0,
          elapsedTime: progress.elapsed_time || 0,
          totalClips: progress.total_clips || 0,
          currentClip: progress.current_clip || 0,
        });

        // Debug logging for progress updates
        console.log('Progress update:', {
          status: progress.status,
          progress: progress.progress,
          message: progress.message,
          threads: progress.threads_used,
          elapsed: progress.elapsed_time,
          totalClips: progress.total_clips,
          currentClip: progress.current_clip
        });

        // Update toast with current progress
        if (progress.status === 'downloading') {
          if (!progressToastId) {
            progressToastId = toast.loading(progress.message, {
              description: `${progress.progress}% complete`
            });
          } else {
            toast.loading(progress.message, {
              id: progressToastId,
              description: `${progress.progress}% complete`
            });
          }
        } else if (progress.status === 'processing') {
          const eta = progress.estimated_time_remaining ? ` | ETA: ${progress.estimated_time_remaining}s` : '';
          const threads = progress.threads_used ? ` | Threads: ${progress.threads_used}` : '';
          const clipInfo = progress.total_clips > 0 && progress.current_clip > 0
            ? `Clip ${progress.current_clip}/${progress.total_clips}${threads}${eta}`
            : `${progress.progress}% complete`;
          toast.loading(progress.message, {
            id: progressToastId,
            description: clipInfo
          });
        }

        // Stop polling if complete or error
        if (progress.status === 'complete' || progress.status === 'error') {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    };

    // Start progress polling every 1 second
    pollInterval = setInterval(pollProgress, 1000);

    // Initial poll
    pollProgress();

    try {
      // Check if backend is accessible
      const isAvailable = await apiService.isBackendAvailable();
      if (!isAvailable) {
        throw new Error('Backend server is not running. Please start the Python server on port 5000.');
      }

      const result = await apiService.generateShorts(youtubeUrl, 'all_30sec_shorts');

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate shorts');
      }

      const report = result.data;

      // Convert the report clips to GeneratedShort format
      const shorts: GeneratedShort[] = report.clip_details.map((clip: ClipDetail) => ({
        id: clip.clip_number.toString(),
        title: `Clip ${clip.clip_number}: ${Math.floor(clip.start_time)}s - ${Math.floor(clip.end_time)}s`,
        thumbnailTime: clip.start_time,
        startTime: clip.start_time,
        endTime: clip.end_time,
        duration: clip.duration,
        score: Math.floor(80 + Math.random() * 20), // Random score for demo
        tags: ['auto-generated', 'short'],
        status: 'ready' as const,
        path: `http://localhost:5000/${clip.filename}`, // Serve from Flask server
      }));

      setGeneratedShorts(shorts);

      // Update final progress
      setGenerationProgress(prev => ({
        ...prev,
        percentage: 100,
        message: 'Complete!',
        status: 'complete'
      }));

      // Dismiss loading toast and show success
      if (progressToastId) {
        toast.dismiss(progressToastId);
      }
      toast.success(`Generated ${shorts.length} shorts from YouTube video!`);

    } catch (error) {
      console.error('Error generating shorts:', error);

      // Update progress to error state
      setGenerationProgress(prev => ({
        ...prev,
        status: 'error',
        message: 'Error occurred during processing'
      }));

      if (progressToastId) {
        toast.dismiss(progressToastId);
      }
      toast.error(`Failed to generate shorts: ${error instanceof Error ? error.message : 'Unknown error'}`);

    } finally {
      setIsGeneratingShorts(false);
      setIsProgressMinimized(false);
      // Clean up polling
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    }
  };

  const handleSelectShort = (short: GeneratedShort) => {
    // If the short has its own video file path, load and play it
    if (short.path) {
      setVideoState((prev) => ({
        ...prev,
        src: short.path,
        currentTime: 0,
        isPlaying: false,
        trimStart: 0,
        trimEnd: 100,
      }));

      // Wait for video to load then play
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
            toast.error('Failed to play video');
          });
          setVideoState((prev) => ({ ...prev, isPlaying: true }));
        }
      }, 100);

      toast.success(`Playing: ${short.title}`);
    } else if (videoRef.current) {
      // Fallback to seeking in the original video
      videoRef.current.currentTime = short.startTime;
      setVideoState((prev) => ({
        ...prev,
        trimStart: (short.startTime / prev.duration) * 100,
        trimEnd: (short.endTime / prev.duration) * 100,
        currentTime: short.startTime,
      }));
      videoRef.current.play();
      setVideoState((prev) => ({ ...prev, isPlaying: true }));
      toast.success(`Selected: ${short.title}`);
    }
  };


  const handleDeleteShort = (shortId: string) => {
    setGeneratedShorts((prevShorts) => {
      // Filter out the deleted short
      const filteredShorts = prevShorts.filter(short => short.id !== shortId);

      // Renumber the remaining shorts
      const renumberedShorts = filteredShorts.map((short, index) => ({
        ...short,
        id: (index + 1).toString(),
        title: `Clip ${index + 1}: ${Math.floor(short.startTime)}s - ${Math.floor(short.endTime)}s`,
      }));

      return renumberedShorts;
    });

    toast.success('Clip deleted and clips renumbered');
  };

  const handleCleanupAll = async () => {
    try {
      // Call backend cleanup
      const response = await apiService.cleanupAll();
      
      if (response.success) {
        // Clear frontend state immediately
        setGeneratedShorts([]);
        setVideoState(prev => ({ ...prev, src: null })); // Optionally clear video if desired, or keep src
        // Reset progress state
        setGenerationProgress({
          percentage: 0,
          message: '',
          threadsUsed: 0,
          estimatedTimeRemaining: 0,
          elapsedTime: 0,
          totalClips: 0,
          currentClip: 0,
        });
        
        toast.success("All data cleaned up successfully");
      } else {
        toast.error(`Cleanup failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup data');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoState.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setVideoState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  // Handle video container mouse events for controls
  const handleVideoMouseEnter = () => {
    setShowVideoControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
      setControlsTimeout(null);
    }
  };

  const handleVideoMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowVideoControls(false);
    }, 2000); // Fade out after 2 seconds
    setControlsTimeout(timeout);
  };

  const handleVideoMouseMove = () => {
    setShowVideoControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      setShowVideoControls(false);
    }, 3000);
    setControlsTimeout(timeout);
  };

  // Click on video to play/pause
  const handleVideoClick = () => {
    togglePlay();
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoState((prev) => ({
        ...prev,
        currentTime: videoRef.current?.currentTime || 0,
      }));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoState((prev) => ({
        ...prev,
        duration: videoRef.current?.duration || 0,
      }));
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setVideoState((prev) => ({ ...prev, currentTime: value[0] }));
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVideoState((prev) => ({ ...prev, volume: value[0], isMuted: value[0] === 0 }));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoState.isMuted;
      setVideoState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setVideoState((prev) => ({ ...prev, playbackRate: speed }));
    }
  };

  const updateAdjustment = (key: keyof VideoState['adjustments'], value: number) => {
    setVideoState((prev) => ({
      ...prev,
      adjustments: { ...prev.adjustments, [key]: value },
    }));
  };

  const updateAudio = (key: keyof VideoState['audio'], value: number | boolean) => {
    setVideoState((prev) => ({
      ...prev,
      audio: { ...prev.audio, [key]: value },
    }));
  };

  const handleRotate = (degrees: number) => {
    setVideoState((prev) => ({
      ...prev,
      rotation: (prev.rotation + degrees) % 360,
    }));
  };

  const handleFlip = (direction: 'h' | 'v') => {
    if (direction === 'h') {
      setVideoState((prev) => ({ ...prev, flipH: !prev.flipH }));
    } else {
      setVideoState((prev) => ({ ...prev, flipV: !prev.flipV }));
    }
  };

  const handleZoom = (delta: number) => {
    setVideoState((prev) => ({
      ...prev,
      zoom: Math.max(50, Math.min(200, prev.zoom + delta)),
    }));
  };

  const handleAITakeover = async () => {
    if (!videoState.src) {
      toast.error('Please upload a video first');
      return;
    }

    if (!aiPrompt.trim()) {
      toast.error('Please describe what you want to do');
      return;
    }

    setIsAIProcessing(true);
    toast.info('AI is analyzing your request...');

    setTimeout(() => {
      const prompt = aiPrompt.toLowerCase();
      
      if (prompt.includes('warm') || prompt.includes('sunset')) {
        updateAdjustment('temperature', 25);
        updateAdjustment('saturation', 15);
        setActiveFilter('warm');
      } else if (prompt.includes('cool') || prompt.includes('cold')) {
        updateAdjustment('temperature', -25);
        setActiveFilter('cool');
      } else if (prompt.includes('cinematic') || prompt.includes('film')) {
        updateAdjustment('contrast', 20);
        updateAdjustment('saturation', -10);
        updateAdjustment('vignette', 30);
        setActiveFilter('dramatic');
      } else if (prompt.includes('vibrant') || prompt.includes('pop') || prompt.includes('colorful')) {
        updateAdjustment('saturation', 30);
        updateAdjustment('contrast', 15);
        setActiveFilter('vivid');
      } else if (prompt.includes('vintage') || prompt.includes('retro') || prompt.includes('old')) {
        setActiveFilter('vintage');
        updateAdjustment('grain', 20);
      } else if (prompt.includes('black and white') || prompt.includes('b&w') || prompt.includes('noir')) {
        setActiveFilter('noir');
      } else if (prompt.includes('bright') || prompt.includes('lighter')) {
        updateAdjustment('brightness', 20);
      } else if (prompt.includes('dark') || prompt.includes('moody')) {
        updateAdjustment('brightness', -20);
        updateAdjustment('contrast', 15);
      } else if (prompt.includes('slow') || prompt.includes('slow motion')) {
        handleSpeedChange(0.5);
      } else if (prompt.includes('fast') || prompt.includes('speed up')) {
        handleSpeedChange(2);
      }

      setIsAIProcessing(false);
      setAiPrompt('');
      toast.success('AI adjustments applied!');
    }, 2000);
  };

  const handleExport = () => {
    if (!videoState.src) {
      toast.error('Please upload a video first');
      return;
    }
    toast.success(`Exporting video in ${exportQuality}p quality...`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoFilters = () => {
    const { brightness, contrast, saturation, blur } = videoState.adjustments;
    const activeFilterStyle = videoFilters.find(f => f.id === activeFilter)?.filter || '';
    return `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100}) blur(${blur}px) ${activeFilterStyle}`;
  };

  const getVideoTransform = () => {
    const { rotation, flipH, flipV, zoom } = videoState;
    const scaleX = flipH ? -1 : 1;
    const scaleY = flipV ? -1 : 1;
    return `rotate(${rotation}deg) scale(${(zoom / 100) * scaleX}, ${(zoom / 100) * scaleY})`;
  };

  const resetAll = () => {
    setVideoState((prev) => ({
      ...prev,
      rotation: 0,
      flipH: false,
      flipV: false,
      zoom: 100,
      adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        blur: 0,
        sharpen: 0,
        vignette: 0,
        grain: 0,
      },
      effects: {
        fadeIn: 0,
        fadeOut: 0,
        slowMo: false,
        reverse: false,
        stabilize: false,
      },
      audio: {
        noiseReduction: 0,
        bassBoost: 0,
        trebleBoost: 0,
        normalize: false,
      },
    }));
    setActiveFilter('none');
    toast.success('All settings reset!');
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">


      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <aside className="w-80 border-r border-border bg-card/30 backdrop-blur-sm overflow-y-auto scrollbar-thin">
          {/* Back Button */}
          <div className="p-4 border-b border-border/50">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <Tabs defaultValue="import" className="p-4">
            <TabsList className="w-full grid grid-cols-7 mb-4 h-auto">
              <TabsTrigger value="import" className="text-xs px-0.5 py-1">Import</TabsTrigger>
              <TabsTrigger value="adjust" className="text-xs px-0.5 py-1">Color</TabsTrigger>
              <TabsTrigger value="transform" className="text-xs px-0.5 py-1">Transform</TabsTrigger>
              <TabsTrigger value="effects" className="text-xs px-0.5 py-1">Effects</TabsTrigger>
              <TabsTrigger value="audio" className="text-xs px-0.5 py-1">Audio</TabsTrigger>
              <TabsTrigger value="text" className="text-xs px-0.5 py-1">Text</TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs px-0.5 py-1">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              {/* Split Import Section */}
              <div className="grid grid-cols-2 gap-3">
                {/* Local Upload */}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Local File
                  </h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-20 border-dashed flex-col gap-1",
                      importSource === 'local' && "border-primary bg-primary/5"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </Button>
                </div>

                {/* YouTube Import */}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium flex items-center gap-1.5">
                    <PlayCircle className="w-3.5 h-3.5 text-red-500" />
                    YouTube
                  </h3>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-20 border-dashed flex-col gap-1",
                      importSource === 'youtube' && "border-primary bg-primary/5"
                    )}
                    onClick={() => document.getElementById('yt-input')?.focus()}
                  >
                    <Link2 className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Paste URL</span>
                  </Button>
                </div>
              </div>

              {/* YouTube URL Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="yt-input"
                    placeholder="Paste YouTube URL..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleYoutubeImport()}
                  />
                  <Button 
                    onClick={handleYoutubeImport} 
                    size="icon" 
                    variant="secondary"
                    disabled={isYoutubeImporting}
                  >
                    {isYoutubeImporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Generate Shorts Button */}
              {importSource === 'youtube' && videoState.src && (
                <Button
                  className="w-full gap-2"
                  variant="secondary"
                  onClick={generateShorts}
                  disabled={isGeneratingShorts}
                >
                  {isGeneratingShorts ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate AI Shorts
                </Button>
              )}

              {/* Supported Formats */}
              <div className="p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
                <strong className="text-foreground">Supported:</strong> MP4, WebM, MOV, AVI, MKV
              </div>
            </TabsContent>

            <TabsContent value="adjust" className="space-y-4">
              {/* Quick Filters */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Quick Filters</h3>
                <div className="grid grid-cols-4 gap-2">
                  {videoFilters.map((filter) => (
                    <button
                      key={filter.id}
                      className={cn(
                        "aspect-square rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium",
                        activeFilter === filter.id
                          ? "border-primary bg-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setActiveFilter(filter.id)}
                    >
                      {filter.name.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Adjustments */}
              {[
                { key: 'brightness', label: 'Brightness', icon: Sun },
                { key: 'contrast', label: 'Contrast', icon: Contrast },
                { key: 'saturation', label: 'Saturation', icon: Droplets },
                { key: 'temperature', label: 'Temperature', icon: Thermometer },
                { key: 'vignette', label: 'Vignette', icon: ImagePlus },
                { key: 'grain', label: 'Grain', icon: Sparkles },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {videoState.adjustments[key as keyof VideoState['adjustments']]}
                    </span>
                  </div>
                  <Slider
                    value={[videoState.adjustments[key as keyof VideoState['adjustments']]]}
                    min={-100}
                    max={100}
                    step={1}
                    onValueChange={(v) => updateAdjustment(key as keyof VideoState['adjustments'], v[0])}
                  />
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={resetAll}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            </TabsContent>

            <TabsContent value="transform" className="space-y-4">
              {/* Rotation */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Rotation</h3>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleRotate(-90)}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    -90°
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => handleRotate(90)}>
                    <RotateCw className="w-4 h-4 mr-1" />
                    +90°
                  </Button>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  Current: {videoState.rotation}°
                </div>
              </div>

              {/* Flip */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Flip</h3>
                <div className="flex gap-2">
                  <Button
                    variant={videoState.flipH ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleFlip('h')}
                  >
                    <FlipHorizontal className="w-4 h-4 mr-1" />
                    Horizontal
                  </Button>
                  <Button
                    variant={videoState.flipV ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => handleFlip('v')}
                  >
                    <FlipVertical className="w-4 h-4 mr-1" />
                    Vertical
                  </Button>
                </div>
              </div>

              {/* Zoom */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Zoom</h3>
                  <span className="text-xs text-muted-foreground">{videoState.zoom}%</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleZoom(-10)}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Slider
                    value={[videoState.zoom]}
                    min={50}
                    max={200}
                    step={5}
                    onValueChange={(v) => setVideoState((prev) => ({ ...prev, zoom: v[0] }))}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={() => handleZoom(10)}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Crop & Position */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-16 flex-col gap-1">
                  <Crop className="w-5 h-5" />
                  <span className="text-xs">Crop</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-1">
                  <Move className="w-5 h-5" />
                  <span className="text-xs">Position</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4">
              {/* Quick Effects */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Scissors, label: 'Trim', action: 'trim' },
                  { icon: Clock, label: 'Speed', action: 'speed' },
                  { icon: Type, label: 'Text Overlay', action: 'text' },
                  { icon: Subtitles, label: 'Subtitles', action: 'subtitles' },
                  { icon: Layers, label: 'Transitions', action: 'transitions' },
                  { icon: MonitorPlay, label: 'Picture-in-Picture', action: 'pip' },
                  { icon: Film, label: 'Slow Motion', action: 'slowmo' },
                  { icon: Zap, label: 'Stabilize', action: 'stabilize' },
                ].map(({ icon: Icon, label }) => (
                  <Button
                    key={label}
                    variant="outline"
                    className="h-16 flex-col gap-1"
                    onClick={() => toast.info(`${label} feature opening...`)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>

              {/* Playback Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    Playback Speed
                  </h3>
                  <span className="text-xs text-muted-foreground">{videoState.playbackRate}x</span>
                </div>
                <div className="flex gap-1">
                  {[0.25, 0.5, 1, 1.5, 2, 4].map((speed) => (
                    <Button
                      key={speed}
                      size="sm"
                      variant={videoState.playbackRate === speed ? 'default' : 'outline'}
                      onClick={() => handleSpeedChange(speed)}
                      className="flex-1 text-xs px-1"
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>

              {/* Fade Controls */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Fade Effects</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Fade In</span>
                    <span className="text-xs text-muted-foreground">{videoState.effects.fadeIn}s</span>
                  </div>
                  <Slider
                    value={[videoState.effects.fadeIn]}
                    min={0}
                    max={5}
                    step={0.1}
                    onValueChange={(v) => setVideoState((prev) => ({
                      ...prev,
                      effects: { ...prev.effects, fadeIn: v[0] },
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Fade Out</span>
                    <span className="text-xs text-muted-foreground">{videoState.effects.fadeOut}s</span>
                  </div>
                  <Slider
                    value={[videoState.effects.fadeOut]}
                    min={0}
                    max={5}
                    step={0.1}
                    onValueChange={(v) => setVideoState((prev) => ({
                      ...prev,
                      effects: { ...prev.effects, fadeOut: v[0] },
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4">
              {/* Audio Controls */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Mic, label: 'Voice Extract' },
                  { icon: Music, label: 'Add Music' },
                  { icon: VolumeOff, label: 'Mute Original' },
                  { icon: Waves, label: 'Equalizer' },
                ].map(({ icon: Icon, label }) => (
                  <Button
                    key={label}
                    variant="outline"
                    className="h-16 flex-col gap-1"
                    onClick={() => toast.info(`${label} feature coming soon!`)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>

              {/* Audio Adjustments */}
              {[
                { key: 'noiseReduction', label: 'Noise Reduction' },
                { key: 'bassBoost', label: 'Bass Boost' },
                { key: 'trebleBoost', label: 'Treble Boost' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {videoState.audio[key as keyof typeof videoState.audio]}%
                    </span>
                  </div>
                  <Slider
                    value={[videoState.audio[key as keyof typeof videoState.audio] as number]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => updateAudio(key as keyof VideoState['audio'], v[0])}
                  />
                </div>
              ))}

              <Button
                variant={videoState.audio.normalize ? 'default' : 'outline'}
                className="w-full"
                onClick={() => updateAudio('normalize', !videoState.audio.normalize)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Normalize Audio
              </Button>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Type className="w-4 h-4 text-accent" />
                    Text & Captions
                  </h4>
                  <p className="text-xs text-muted-foreground">Add text overlays and captions to your video</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Add Text Overlay</label>
                  <Input placeholder="Enter text..." className="text-sm" />
                  <Button className="w-full gap-2 text-xs">
                    <Type className="w-3.5 h-3.5" />
                    Add Text
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Font Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Bold', 'Italic', 'Underline', 'Outline'].map((style) => (
                      <Button
                        key={style}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => toast.info(`${style} text style applied`)}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto Captions</label>
                  <Button 
                    variant="secondary" 
                    className="w-full gap-2 text-xs"
                    onClick={() => toast.info('Generating captions using AI speech recognition...')}
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    Generate Captions
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Caption Style</label>
                  <Select>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Choose caption style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White with Shadow</SelectItem>
                      <SelectItem value="black">Black with Border</SelectItem>
                      <SelectItem value="custom">Custom Color</SelectItem>
                      <SelectItem value="background">Full Background</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Advanced Tools
                  </h4>
                  <p className="text-xs text-muted-foreground">Professional video editing features</p>
                </div>

                {/* Keyframe Animation */}
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Keyframe Animation
                  </h5>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-xs"
                    onClick={() => toast.info('Keyframe markers added at current time')}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Add Keyframe
                  </Button>
                </div>

                {/* Motion Blur */}
                <div className="space-y-2">
                  <label className="text-xs font-medium flex items-center gap-2">
                    <Move className="w-3.5 h-3.5" />
                    Motion Blur
                  </label>
                  <Slider
                    value={[0]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={() => {}}
                  />
                </div>

                {/* Color Lookup Table */}
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" />
                    LUT (Color Lookup Table)
                  </h5>
                  <Select>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select LUT" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="retro">Retro Film</SelectItem>
                      <SelectItem value="scifi">Sci-Fi</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Video Stabilization */}
                <Button
                  variant={videoState.effects.stabilize ? 'default' : 'outline'}
                  className="w-full gap-2 text-xs"
                  onClick={() => setVideoState(prev => ({
                    ...prev,
                    effects: { ...prev.effects, stabilize: !prev.effects.stabilize }
                  }))}
                >
                  <Move className="w-3.5 h-3.5" />
                  {videoState.effects.stabilize ? 'Stabilization: ON' : 'Video Stabilization'}
                </Button>

                {/* Quality Enhancement */}
                <Button
                  variant="outline"
                  className="w-full gap-2 text-xs"
                  onClick={() => toast.info('Applying AI upscaling to enhance video quality...')}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  AI Quality Enhance
                </Button>

                {/* Chromatic Aberration */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Chromatic Aberration</label>
                  <Slider
                    value={[0]}
                    min={0}
                    max={50}
                    step={1}
                    onValueChange={() => {}}
                  />
                </div>

                {/* Transition Library */}
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    Transitions
                  </h5>
                  <Select>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select transition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="crossfade">Cross Fade</SelectItem>
                      <SelectItem value="slideL">Slide Left</SelectItem>
                      <SelectItem value="slideR">Slide Right</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="blur">Blur Transition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-gradient-to-br from-background via-secondary/5 to-background overflow-hidden">
          {isFullscreen ? (
            // Fullscreen mode - video takes full space of the middle area only
            <div className={cn(
              "relative w-full h-full flex items-center justify-center bg-gradient-to-br from-black/80 via-black/60 to-black/80 p-0"
            )}>
              {/* Decorative background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb,120,119,198),0.1),transparent_50%)]" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              
              {videoState.src ? (
                <div 
                  className="relative w-full h-full flex items-center justify-center cursor-pointer group"
                  onMouseEnter={handleVideoMouseEnter}
                  onMouseLeave={handleVideoMouseLeave}
                  onMouseMove={handleVideoMouseMove}
                  onClick={handleVideoClick}
                >
                  <div className="relative max-w-full max-h-full flex items-center justify-center">
                    <video
                      ref={videoRef}
                      src={videoState.src}
                      className="w-auto h-auto max-w-full max-h-full rounded-xl shadow-2xl shadow-primary/20 border border-primary/20 transition-transform"
                      style={{ 
                        filter: getVideoFilters(),
                        transform: getVideoTransform(),
                        objectFit: 'contain',
                      }}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setVideoState((prev) => ({ ...prev, isPlaying: false }))}
                      muted={videoState.isMuted}
                    />
                  </div>
                  
                  {/* Overlay info */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-white">LIVE PREVIEW</span>
                  </div>
                  
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg w-8 h-8"
                    onClick={toggleFullscreen}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>

                  {/* Play overlay */}
                  {!videoState.isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-2xl border-4 border-white/20 group-hover:scale-110 transition-transform">
                        <Play className="w-10 h-10 text-white fill-white ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Player Controls - Always show in fullscreen */}
              {videoState.src && (
                <div
                  className={cn(
                    "absolute bottom-16 left-6 right-6 p-4 border-2 border-primary/20 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-md rounded-xl shadow-2xl shadow-primary/10 transition-all duration-300",
                    showVideoControls ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  <div className="mb-3">
                    <Slider
                      value={[videoState.currentTime]}
                      min={0}
                      max={videoState.duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                      <span className="tabular-nums">{formatTime(videoState.currentTime)}</span>
                      <span className="tabular-nums">{formatTime(videoState.duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSeek([0])}>
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button size="icon" className="h-9 w-9" onClick={togglePlay}>
                        {videoState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSeek([videoState.duration])}>
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Volume Control */}
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                          {videoState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <Slider
                          value={[videoState.isMuted ? 0 : videoState.volume]}
                          min={0}
                          max={1}
                          step={0.1}
                          onValueChange={handleVolumeChange}
                          className="w-20"
                        />
                      </div>

                      {/* Export Controls */}
                      <div className="flex items-center gap-2">
                        <Select value={exportQuality} onValueChange={setExportQuality}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Quality" />
                          </SelectTrigger>
                          <SelectContent>
                            {exportQualities.map((q) => (
                              <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleExport} 
                          size="sm"
                          className="gap-1 h-8"
                        >
                          <Download className="w-3 h-3" />
                          Export
                        </Button>
                      </div>

                      {/* Exit Fullscreen Button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={toggleFullscreen}
                        title="Exit Fullscreen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Normal mode - split 50/50
            <>
              {/* Top Half - Video Preview Container */}
              <div className="h-1/2 flex items-center justify-center bg-gradient-to-br from-black/80 via-black/60 to-black/80 relative overflow-hidden border-b border-primary/20 p-6">
                {/* Decorative background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb,120,119,198),0.1),transparent_50%)]" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                
                {videoState.src ? (
                  <div 
                    className="relative w-full h-full flex items-center justify-center cursor-pointer group rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl shadow-primary/20 overflow-hidden"
                    onMouseEnter={handleVideoMouseEnter}
                    onMouseLeave={handleVideoMouseLeave}
                    onMouseMove={handleVideoMouseMove}
                    onClick={handleVideoClick}
                  >
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      <video
                        ref={videoRef}
                        src={videoState.src}
                        className="w-full h-full transition-transform"
                        style={{
                          filter: getVideoFilters(),
                          transform: getVideoTransform(),
                          objectFit: 'contain',
                        }}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setVideoState((prev) => ({ ...prev, isPlaying: false }))}
                        muted={videoState.isMuted}
                      />
                    </div>
                    
                    {/* Overlay info */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-medium text-white">LIVE PREVIEW</span>
                    </div>

                    {/* Play overlay */}
                    {!videoState.isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-2xl border-4 border-white/20 group-hover:scale-110 transition-transform">
                          <Play className="w-10 h-10 text-white fill-white ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center relative z-10 px-6">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-lg">
                      <Upload className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Professional Video Editor
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      Import your video to start editing with AI-powered tools and effects
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        size="lg"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2 shadow-lg"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Video
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline" 
                        onClick={() => document.getElementById('yt-input')?.focus()}
                        className="gap-2 border-primary/30 hover:bg-primary/10"
                      >
                        <Youtube className="w-4 h-4" />
                        Import from YouTube
                      </Button>
                    </div>
                  </div>
                )}

                {/* Player Controls - Only show if not fullscreen */}
                {videoState.src && (
                  <div 
                    className={cn(
                      "absolute bottom-4 left-4 right-4 p-3 border-2 border-primary/20 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-md rounded-xl shadow-2xl shadow-primary/10 transition-all duration-300",
                      showVideoControls ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                  >
                    <div className="mb-2">
                      <Slider
                        value={[videoState.currentTime]}
                        min={0}
                        max={videoState.duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span className="tabular-nums">{formatTime(videoState.currentTime)}</span>
                        <span className="tabular-nums">{formatTime(videoState.duration)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSeek([0])}>
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button size="icon" className="h-9 w-9" onClick={togglePlay}>
                          {videoState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSeek([videoState.duration])}>
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Volume Control */}
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                            {videoState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                          <Slider
                            value={[videoState.isMuted ? 0 : videoState.volume]}
                            min={0}
                            max={1}
                            step={0.1}
                            onValueChange={handleVolumeChange}
                            className="w-20"
                          />
                        </div>

                        {/* Export Controls */}
                        <div className="flex items-center gap-2">
                          <Select value={exportQuality} onValueChange={setExportQuality}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Quality" />
                            </SelectTrigger>
                            <SelectContent>
                              {exportQualities.map((q) => (
                                <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleExport} 
                            size="sm"
                            className="gap-1 h-8"
                          >
                            <Download className="w-3 h-3" />
                            Export
                          </Button>
                        </div>

                        {/* Fullscreen Button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={toggleFullscreen}
                          title="Fullscreen"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Half - Shorts Showcase */}
              <div className="h-1/2 flex flex-col bg-gradient-to-b from-card/50 to-secondary/30 backdrop-blur-sm overflow-hidden border-t border-primary/20">
                {generatedShorts.length > 0 ? (

                  <ShortsShowcase
                    isGenerating={isGeneratingShorts}
                    shorts={generatedShorts}
                    onSelectShort={handleSelectShort}
                    onRegenerateShorts={generateShorts}
                    onDeleteShort={handleDeleteShort}
                    onDeleteAll={() => setShowDeleteConfirm(true)}
                    videoSrc={importSource === 'youtube' ? videoState.src : null}
                    gridLayout={true}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {isGeneratingShorts ? 'Generating AI shorts...' : 'Import a YouTube video to generate AI shorts'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* Right Sidebar - AI Assistant */}
        <aside className="w-80 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col hidden lg:flex">
          <VideoAIAssistant
            isProcessing={isAIProcessing}
            onAICommand={handleAITakeover}
            currentAdjustments={videoState.adjustments}
          />
        </aside>
      </div>


      {/* Progress Modal */}
      {isGeneratingShorts && !isProgressMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-primary/20 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative">
             <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsProgressMinimized(true)}
              title="Run in Background"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-lg font-semibold">Generating Shorts</h3>
              </div>
              <p className="text-sm text-muted-foreground">{generationProgress.message}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden border border-primary/10">
                <div
                  className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-300"
                  style={{ width: `${generationProgress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-medium text-foreground">{generationProgress.percentage}%</span>
                <span className="text-xs text-muted-foreground">
                  {generationProgress.currentClip}/{generationProgress.totalClips} clips
                </span>
              </div>
            </div>


            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Threads Used */}
              <div className="bg-secondary/30 rounded-lg p-3 border border-primary/10">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Threads
                </div>
                <div className="text-lg font-bold text-primary">
                  {generationProgress.threadsUsed || 0}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="bg-secondary/30 rounded-lg p-3 border border-primary/10">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ETA
                </div>
                <div className="text-lg font-bold text-accent">
                  {generationProgress.estimatedTimeRemaining || 0}s
                </div>
              </div>

              {/* Elapsed Time */}
              <div className="bg-secondary/30 rounded-lg p-3 border border-primary/10">
                <div className="text-xs text-muted-foreground mb-1">Elapsed</div>
                <div className="text-lg font-bold text-foreground">
                  {generationProgress.elapsedTime || 0}s
                </div>
              </div>

              {/* Current Clip */}
              <div className="bg-secondary/30 rounded-lg p-3 border border-primary/10">
                <div className="text-xs text-muted-foreground mb-1">Processing</div>
                <div className="text-lg font-bold text-primary">
                  Clip {generationProgress.currentClip || 0}
                </div>
              </div>
            </div>


            {/* Info Message */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground mb-4">
              <p className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  {generationProgress.threadsUsed > 1 
                    ? `Processing with ${generationProgress.threadsUsed} parallel threads for faster generation`
                    : 'Processing video clips...'}
                </span>
              </p>
            </div>
            
            <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => setIsProgressMinimized(true)}
            >
                <Minimize2 className="w-4 h-4" />
                Run in Background
            </Button>
          </div>
        </div>
      )}

      {/* Minimized Progress Indicator */}
      {isGeneratingShorts && isProgressMinimized && (
        <div 
          className="fixed bottom-6 right-6 z-50 bg-card/90 backdrop-blur-md border border-primary/20 rounded-xl shadow-2xl p-4 cursor-pointer hover:bg-card transition-all w-64 animate-in slide-in-from-bottom-5"
          onClick={() => setIsProgressMinimized(false)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="text-xs font-semibold">Generating...</span>
            </div>
             <span className="text-xs font-bold text-primary">{generationProgress.percentage}%</span>
          </div>
          
           <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden mb-1">
                <div
                  className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-300"
                  style={{ width: `${generationProgress.percentage}%` }}
                />
           </div>
           <p className="text-[10px] text-muted-foreground truncate">{generationProgress.message}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all generated clips and source files? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCleanupAll}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
             
        

          

             