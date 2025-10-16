"use client";
import { useEffect, useRef, useState } from "react";

function useSpeech() {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recRef.current = rec;
    }
  }, []);

  const start = (onResult: (text: string) => void) => {
    const rec = recRef.current;
    if (!rec) {
      alert("Speech Recognition not supported.");
      return;
    }
    setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.start();
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  return { start, speak, listening };
}

type Msg = { role: "user" | "assistant"; text: string; ts: number };

export default function VoiceChatWidget() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const { start, speak, listening } = useSpeech();

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const sessionId = sessionIdRef.current;
    setMsgs((m) => [...m, { role: "user", text, ts: Date.now() }]);
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text }),
      });
      const data = await r.json();
      const reply = data.reply as string;
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: reply, ts: Date.now() },
      ]);
      speak(reply);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: 380,
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        background: "#fff",
        boxShadow: "0 12px 32px rgba(0,0,0,.12)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          fontWeight: 700,
          borderBottom: "1px solid #eee",
        }}
      >
        Shop Assistant
      </div>
      <div
        style={{
          height: 300,
          overflow: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              background: m.role === "user" ? "#eef2ff" : "#f8fafc",
              border: "1px solid #e5e7eb",
              padding: 8,
              borderRadius: 10,
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.6 }}>{m.role}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: 10,
          borderTop: "1px solid #eee",
          display: "flex",
          gap: 8,
        }}
      >
        <button
          disabled={busy || listening}
          onClick={() => start(send)}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: listening ? "#fef3c7" : "#fff",
          }}
        >
          🎤 {listening ? "Listening…" : "Talk"}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (send(input), setInput(""))}
          placeholder="Ask about products…"
          style={{
            flex: 1,
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: "8px 10px",
          }}
        />
        <button
          disabled={busy}
          onClick={() => {
            send(input);
            setInput("");
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            background: "#111827",
            color: "#fff",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
