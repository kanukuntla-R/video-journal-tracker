import argparse

from backend.video_service.services.transcribe import transcribe_audio


DEFAULT_AUDIO_PATH = "backend/video_service/test_audio_converted.mp3"


def main():
    parser = argparse.ArgumentParser(description="Run a local faster-whisper transcription test.")
    parser.add_argument(
        "file_path",
        nargs="?",
        default=DEFAULT_AUDIO_PATH,
        help=f"Audio/video file to transcribe. Defaults to {DEFAULT_AUDIO_PATH}",
    )
    args = parser.parse_args()

    result = transcribe_audio(args.file_path)
    print("Transcription:", result)


if __name__ == "__main__":
    main()
