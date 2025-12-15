// FILE: frontend/src/pages/Journal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import TabBar from "../components/TabBar.jsx";
import { PlusIcon } from "../components/Icons.jsx";
import { getJournalById, getJournalsByDate, transcribeMedia, API_BASE } from "../services/api.js";

// Very small stopword list (good enough for MVP keyword chips)
const STOP = new Set([
  "the","and","a","an","to","of","in","on","for","with","is","it","that","this","i","im","i'm",
  "you","we","they","he","she","was","were","are","be","been","but","so","as","at","by","or",
  "from","my","your","our","their","today","yesterday","tomorrow"
]);

function extractKeywords(text, max = 6) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 4 && !STOP.has(w));

  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

export default function Journal() {
  const nav = useNavigate();
  const { date } = useParams(); // /journal/:date

  const [loading, setLoading] = useState(true);
  const [journal, setJournal] = useState(null);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  // Local preview (works immediately after user selects a file)
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState(""); // "video" or "audio"

  const fileInputRef = useRef(null);

  const prettyDate = useMemo(() => {
    const d = dayjs(date);
    return d.isValid() ? d.format("MMM D, YYYY") : date;
  }, [date]);

  const summaryKeywords = useMemo(() => extractKeywords(journal?.summary, 6), [journal?.summary]);
  const transcriptKeywords = useMemo(() => extractKeywords(journal?.transcript, 6), [journal?.transcript]);

  // Helper to get media URL from journal's video_path
  const getMediaUrl = (journalEntry) => {
    if (!journalEntry?.video_path) return null;
    
    // Extract user_id, date, and filename from video_path
    // video_path format: backend/video_service/storage/{user_id}/{date}/journal_{uuid}.mp3
    const parts = journalEntry.video_path.split('/');
    if (parts.length >= 4) {
      const user_id = parts[parts.length - 3];
      const date = parts[parts.length - 2];
      const filename = parts[parts.length - 1];
      return `${API_BASE}/media/${user_id}/${date}/${filename}`;
    }
    return null;
  };

  // Determine media URL and type
  const mediaUrl = previewUrl || (journal ? getMediaUrl(journal) : null);
  
  // Determine media type: check for video extensions, otherwise assume audio
  const getMediaType = (path) => {
    if (!path) return 'video';
    const lowerPath = path.toLowerCase();
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    return videoExtensions.some(ext => lowerPath.endsWith(ext)) ? 'video' : 'audio';
  };
  
  const mediaType = previewType || (journal ? getMediaType(journal.video_path) : 'video');

  // Cleanup preview URL on unmount or when replaced
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Load journal for the date from backend
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      setJournal(null);

      try {
        const list = await getJournalsByDate(date);
        if (!alive) return;

        if (Array.isArray(list) && list.length > 0) {
          // pick latest
          setJournal(list[0]);
        } else {
          setJournal(null);
        }
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load journal");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (date) load();
    return () => {
      alive = false;
    };
  }, [date]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    // reset input so picking the same file again works
    e.target.value = "";
    if (!file) return;

    // clear previous preview URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    // Create local preview first
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewType(file.type.startsWith("audio/") ? "audio" : "video");

    setUploading(true);
    setErr("");

    try {
      // Upload to backend → transcribe → summarize → save → returns journal_id
      const result = await transcribeMedia(file, { date, userId: "anonymous" });

       if (!result?.journal_id) {
        throw new Error("Upload succeeded but journal_id is missing");
      }

      // Fetch the stored journal doc
      const full = await getJournalById(result.journal_id);
      setJournal(full);
    } catch (e2) {
      setErr(e2?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const hasEntry = !!journal;

  return (
    <div className="page journalPage">
      {/* Header */}
      <div className="journalHeader">
        <button className="pillButton" onClick={() => nav(-1)}>
          {"<"} Back
        </button>

        <div className="journalHeaderRight">
          <div className="journalDate">{prettyDate}</div>
          {hasEntry && (
            <div className="journalMeta">
              {typeof journal.duration === "number" ? `${journal.duration}s` : ""}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        style={{ display: "none" }}
        onChange={onPickFile}
      />

      {/* Loading / error */}
      {loading && <div className="card">Loading…</div>}
      {!!err && <div className="card" style={{ color: "var(--orange)" }}>{err}</div>}

      {/* EMPTY STATE: no entry for this date */}
      {!loading && !hasEntry && (
        <div className="journalEmpty">
          <button className="createCircle" onClick={openFilePicker} disabled={uploading}>
            <PlusIcon />
          </button>
          <div className="journalEmptyText">
            {uploading ? "Creating your journal…" : "No journal for this day. Tap + to create."}
          </div>
        </div>
      )}

      {/* ENTRY STATE */}
      {!loading && hasEntry && (
        <>
          {/* VIDEO / AUDIO card */}
          <div className="card">
            <div className="journalSectionLabel">VIDEO</div>

            {mediaUrl ? (
              mediaType === "audio" ? (
                <audio className="mediaPlayer" controls src={mediaUrl} />
              ) : (
                <video className="mediaPlayer" controls src={mediaUrl} />
              )
            ) : (
              <div className="mutedBlock">
                Stored on server as: <span className="mono">{journal.video_path}</span>
                <div style={{ marginTop: 8, color: "var(--muted)" }}>
                  (Media file not found or unavailable.)
                </div>
              </div>
            )}

            <button className="smallAction" onClick={openFilePicker} disabled={uploading}>
              {uploading ? "Processing…" : "Replace / Upload again"}
            </button>
          </div>

          {/* SUMMARY card */}
          <div className="card">
            <div className="journalSectionRow">
              <div className="journalSectionLabel">SUMMARY</div>
              <div className="kwRow">
                {summaryKeywords.map((k) => (
                  <span key={k} className="chip chipOrange">{k}</span>
                ))}
              </div>
            </div>

            <div className="textBlock">
              {journal.summary || "No summary yet."}
            </div>
          </div>

          {/* TRANSCRIPT card */}
          <div className="card">
            <div className="journalSectionRow">
              <div className="journalSectionLabel">TRANSCRIPT</div>
              <div className="kwRow">
                {transcriptKeywords.map((k) => (
                  <span key={k} className="chip chipPurple">{k}</span>
                ))}
              </div>
            </div>

            <div className="textBlock">
              {journal.transcript || "No transcript yet."}
            </div>
          </div>
        </>
      )}

      <TabBar />
    </div>
  );
}