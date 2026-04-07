"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, Loader2, Search, RotateCcw,
  Mic, MicOff, Volume2, VolumeX,
} from "lucide-react";
import Link from "next/link";

type VoiceState = "idle" | "listening" | "speaking";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SearchAction {
  city: string;
  specialty: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => ISR;
interface ISR extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: ISREvent) => void) | null;
  onerror: ((e: ISRError) => void) | null;
  onend: (() => void) | null;
}
interface ISREvent extends Event { results: SpeechRecognitionResultList; }
interface ISRError extends Event { error: string; }

const GREETING: Message = {
  role: "assistant",
  content:
    "Hello! I'm your AI medical assistant. Describe your symptoms or tell me what kind of doctor you need — I'll help you find the right one, anywhere in the world. Type or use the mic to speak! 🎤",
};

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<SearchAction | null>(null);
  const [voiceOut, setVoiceOut] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micError, setMicError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<ISR | null>(null);
  const voiceOutRef = useRef(false);
  const messagesRef = useRef<Message[]>([GREETING]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR && !!window.speechSynthesis);
  }, []);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { voiceOutRef.current = voiceOut; }, [voiceOut]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const speakText = useCallback((text: string) => {
    if (!voiceOutRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.93;
    setVoiceState("speaking");
    utt.onend = () => setVoiceState("idle");
    window.speechSynthesis.speak(utt);
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setMicError("");
    const userMsg: Message = { role: "user", content: text };
    const newMsgs = [...messagesRef.current, userMsg];
    setMessages(newMsgs);
    messagesRef.current = newMsgs;
    setInput("");
    setAction(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await res.json();
      if (data.reply) {
        const aiMsg: Message = { role: "assistant", content: data.reply };
        const updated = [...messagesRef.current, aiMsg];
        setMessages(updated);
        messagesRef.current = updated;
        speakText(data.reply);
      }
      if (data.action) setAction(data.action);
    } catch {
      const errMsg: Message = { role: "assistant", content: "Sorry, I couldn't connect. Please try again." };
      setMessages((p) => [...p, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setMicError("");
    window.speechSynthesis?.cancel();
    setVoiceState("listening");

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setVoiceState("idle");
      sendMessage(text);
    };

    rec.onerror = (e) => {
      setVoiceState("idle");
      if (e.error === "not-allowed") setMicError("Microphone access denied.");
      else if (e.error === "no-speech") setMicError("No speech detected. Try again.");
    };

    rec.onend = () => {
      if (voiceState === "listening") setVoiceState("idle");
    };

    recRef.current = rec;
    rec.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopListening() {
    recRef.current?.stop();
    setVoiceState("idle");
  }

  function toggleVoiceOut() {
    const next = !voiceOut;
    setVoiceOut(next);
    if (!next) window.speechSynthesis?.cancel();
  }

  function reset() {
    window.speechSynthesis?.cancel();
    recRef.current?.stop();
    setMessages([GREETING]);
    messagesRef.current = [GREETING];
    setInput("");
    setAction(null);
    setVoiceState("idle");
    setMicError("");
  }

  const busy = loading || voiceState === "speaking";
  const searchUrl = action
    ? `/search?city=${encodeURIComponent(action.city)}${action.specialty ? `&specialty=${encodeURIComponent(action.specialty)}` : ""}`
    : "";
  const recommendUrl = action
    ? `/recommend?city=${encodeURIComponent(action.city)}${action.specialty ? `&specialty=${encodeURIComponent(action.specialty)}` : ""}`
    : "";

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI Conversation</h1>
            <p className="text-xs text-gray-400">
              {voiceOut ? "Voice mode on · AI will speak replies" : "Type or speak · any language"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice output toggle */}
          {speechSupported && (
            <button
              onClick={toggleVoiceOut}
              title={voiceOut ? "Mute AI voice" : "Enable AI voice"}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                voiceOut
                  ? "bg-brand-50 border-brand-200 text-brand-600"
                  : "border-gray-200 text-gray-400 hover:text-gray-600"
              }`}
            >
              {voiceOut ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{voiceOut ? "Voice on" : "Voice off"}</span>
            </button>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === "assistant" ? "bg-brand-100" : "bg-gray-100"
            }`}>
              {msg.role === "assistant"
                ? <Bot className="w-4 h-4 text-brand-600" />
                : <User className="w-4 h-4 text-gray-500" />}
            </div>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm"
                : "bg-brand-600 text-white rounded-tr-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-brand-600" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Speaking indicator */}
        {voiceState === "speaking" && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-brand-600" />
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
              <span className="text-xs text-brand-500 font-medium">Speaking...</span>
            </div>
          </div>
        )}

        {/* Search action card */}
        {action && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-brand-600" />
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <p className="text-xs text-brand-600 font-semibold mb-2">Ready to search!</p>
              <div className="flex flex-col gap-2">
                <Link href={searchUrl}
                  className="flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors">
                  <Search className="w-4 h-4" />
                  Search {action.specialty ? `${action.specialty} doctors` : "doctors"} in {action.city}
                </Link>
                <Link href={recommendUrl}
                  className="flex items-center gap-2 border border-brand-200 text-brand-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors">
                  <Bot className="w-4 h-4" />
                  Get full AI recommendation
                </Link>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 pt-3 border-t border-gray-100 space-y-2">
        {micError && <p className="text-xs text-red-500 px-1">{micError}</p>}

        <form onSubmit={handleSubmit} className="flex gap-2">
          {/* Mic button */}
          {speechSupported && (
            <button
              type="button"
              onClick={voiceState === "listening" ? stopListening : startListening}
              disabled={busy}
              title={voiceState === "listening" ? "Stop listening" : "Speak your message"}
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                voiceState === "listening"
                  ? "bg-red-500 text-white animate-pulse shadow-md"
                  : busy
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600"
              }`}
            >
              {voiceState === "listening"
                ? <MicOff className="w-5 h-5" />
                : <Mic className="w-5 h-5" />}
            </button>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={voiceState === "listening" ? "Listening..." : "Type or speak your message..."}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
              voiceState === "listening"
                ? "border-red-200 bg-red-50 placeholder-red-300"
                : "border-gray-200"
            }`}
          />

          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="w-12 h-12 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          {speechSupported
            ? "Press mic to speak · Toggle voice to hear AI replies"
            : "Type your message and press send"}
        </p>
      </div>
    </div>
  );
}
