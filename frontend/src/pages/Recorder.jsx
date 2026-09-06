import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import TabBar from "../components/TabBar.jsx";
import { transcribeMedia } from "../services/api.js";

const MAX_DURATION_SECONDS = 10 * 60;

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return null;

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || null;
}

function extensionForMime(mime) {
  return mime?.startsWith("video/mp4") ? "mp4" : "webm";
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function Recorder() {
  const nav = useNavigate();
  const { date } = useParams();

  const liveVideoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const tickRef = useRef(null);

  const [status, setStatus] = useState("init");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [mime, setMime] = useState(null);

  const prettyDate = (() => {
    const parsed = dayjs(date);
    return parsed.isValid() ? parsed.format("MMM D, YYYY") : date;
  })();

  const stopTimer = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const initCamera = useCallback(async () => {
    setError("");
    setStatus("init");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support camera recording.");
      setStatus("error");
      return;
    }

    const chosenMime = pickMimeType();
    if (!chosenMime) {
      setError("MediaRecorder is not supported in this browser.");
      setStatus("error");
      return;
    }
    setMime(chosenMime);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: true,
      });

      streamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
      setStatus("ready");
    } catch (err) {
      const message =
        err?.name === "NotAllowedError"
          ? "Camera and microphone access were denied. Allow access in your browser and try again."
          : err?.name === "NotFoundError"
            ? "No camera or microphone was found on this device."
            : err?.message || "Could not access camera or microphone.";
      setError(message);
      setStatus("error");
    }
  }, []);

  const handleStop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const startTimer = useCallback(() => {
    setElapsed(0);
    tickRef.current = setInterval(() => {
      setElapsed((seconds) => {
        const next = seconds + 1;
        if (next >= MAX_DURATION_SECONDS) handleStop();
        return next;
      });
    }, 1000);
  }, [handleStop]);

  useEffect(() => {
    const setupId = window.setTimeout(() => {
      initCamera();
    }, 0);

    return () => {
      window.clearTimeout(setupId);
      stopTimer();
      stopStream();
    };
  }, [initCamera, stopStream, stopTimer]);

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  function handleStart() {
    if (!streamRef.current || !mime) return;
    chunksRef.current = [];

    let recorder;
    try {
      recorder = new MediaRecorder(streamRef.current, { mimeType: mime });
    } catch (err) {
      setError(`Could not start recording: ${err?.message || "unknown error"}`);
      setStatus("error");
      return;
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      stopTimer();
      stopStream();

      const blob = new Blob(chunksRef.current, { type: mime });
      if (!blob.size) {
        setError("The recording was empty. Please try again.");
        setStatus("error");
        return;
      }

      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setStatus("recorded");
    };

    recorderRef.current = recorder;
    recorder.start(1000);
    setStatus("recording");
    startTimer();
  }

  async function handleRetake() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl("");
    setRecordedBlob(null);
    setElapsed(0);
    await initCamera();
  }

  async function handleSave() {
    if (!recordedBlob) return;

    setStatus("uploading");
    setError("");

    const extension = extensionForMime(mime);
    const filename = `recording_${dayjs().format("YYYYMMDD_HHmmss")}.${extension}`;
    const file = new File([recordedBlob], filename, { type: mime });

    try {
      const result = await transcribeMedia(file, { date, userId: "anonymous" });
      if (!result?.journal_id) {
        throw new Error("Upload succeeded but journal_id is missing");
      }
      nav(`/journal/${date}?id=${result.journal_id}`);
    } catch (err) {
      setError(err?.message || "Upload failed");
      setStatus("recorded");
    }
  }

  const showRecordedVideo = status === "recorded" || status === "uploading";

  return (
    <div className="page recorderPage">
      <div className="journalHeader">
        <button className="pillButton" onClick={() => nav(-1)}>
          {"<"} Back
        </button>
        <div className="journalHeaderRight">
          <div className="journalDate">{prettyDate}</div>
          <div className="journalMeta">New video journal</div>
        </div>
      </div>

      <div className="recorderStage">
        {showRecordedVideo ? (
          <video className="recorderVideo" src={recordedUrl} controls playsInline />
        ) : (
          <video
            ref={liveVideoRef}
            className="recorderVideo recorderMirror"
            autoPlay
            muted
            playsInline
          />
        )}

        {status === "recording" && (
          <div className="recorderBadge">
            <span className="recorderDot" />
            REC {formatDuration(elapsed)}
          </div>
        )}

        {(status === "init" || status === "error") && (
          <div className="recorderOverlay">
            {status === "init" && "Waiting for camera permission..."}
            {status === "error" && (error || "Camera unavailable")}
          </div>
        )}
      </div>

      <div className="recorderStatusLine">
        {status === "ready" && "Ready to record."}
        {status === "recording" &&
          `Recording ${formatDuration(elapsed)} / ${formatDuration(MAX_DURATION_SECONDS)}`}
        {status === "recorded" &&
          `Captured ${formatDuration(elapsed)}. Review it, then save or retake.`}
        {status === "uploading" && "Uploading, transcribing, and summarizing..."}
      </div>

      {!!error && status !== "error" && (
        <div className="card" style={{ color: "var(--orange)" }}>
          {error}
        </div>
      )}

      <div className="recorderControls">
        {status === "ready" && (
          <button className="recorderRecordBtn" onClick={handleStart} aria-label="Start recording">
            <span className="recorderRecordCircle" />
          </button>
        )}

        {status === "recording" && (
          <button
            className="recorderRecordBtn recorderRecordBtnActive"
            onClick={handleStop}
            aria-label="Stop recording"
          >
            <span className="recorderStopSquare" />
          </button>
        )}

        {status === "recorded" && (
          <div className="recorderReviewRow">
            <button className="recorderSecondaryBtn" onClick={handleRetake}>
              Retake
            </button>
            <button className="recorderPrimaryBtn" onClick={handleSave}>
              Save &amp; Transcribe
            </button>
          </div>
        )}

        {status === "uploading" && (
          <div className="recorderReviewRow">
            <button className="recorderSecondaryBtn" disabled>
              Retake
            </button>
            <button className="recorderPrimaryBtn" disabled>
              Processing...
            </button>
          </div>
        )}

        {status === "error" && (
          <button className="recorderPrimaryBtn" onClick={initCamera}>
            Try again
          </button>
        )}
      </div>

      <TabBar />
    </div>
  );
}
