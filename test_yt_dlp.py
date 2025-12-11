
import yt_dlp
import json

url = "https://www.youtube.com/watch?v=11Hnld1r84o"
ydl_opts = {
    'quiet': True,
    'no_warnings': True,
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    try:
        info = ydl.extract_info(url, download=False)
        print(json.dumps(info, indent=2))
    except Exception as e:
        print(f"Error: {e}")
