import subprocess


def extract_audio_from_video(video_path: str, output_mp3_path: str):
    commond = [
        "ffmpeg",
        "-i", video_path,
        "-vn",  # no video
        "-acodec", "libmp3lame",
        "-ar", "44100",
        "-b:a", "192k",
        output_mp3_path

    ]
    subprocess.run(commond, check=True)