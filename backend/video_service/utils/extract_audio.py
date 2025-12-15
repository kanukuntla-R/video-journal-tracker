import subprocess
import logging

logger = logging.getLogger(__name__)


def extract_audio_from_video(video_path: str, output_mp3_path: str):
    """
    Extract audio from video file using ffmpeg.
    Raises subprocess.CalledProcessError if ffmpeg fails.
    """
    command = [
        "ffmpeg",
        "-i", video_path,
        "-vn",  # no video
        "-acodec", "libmp3lame",
        "-ar", "44100",
        "-b:a", "192k",
        "-y",  # overwrite output file if it exists
        output_mp3_path
    ]
    
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout for long videos
        )
        logger.info(f"Successfully extracted audio from {video_path} to {output_mp3_path}")
    except subprocess.TimeoutExpired:
        logger.error(f"FFmpeg timeout for {video_path}")
        raise Exception("Video processing timed out (file may be too large)")
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else "Unknown ffmpeg error"
        logger.error(f"FFmpeg failed for {video_path}: {error_msg}")
        raise
    except FileNotFoundError:
        raise Exception("FFmpeg not found. Please install ffmpeg: brew install ffmpeg")