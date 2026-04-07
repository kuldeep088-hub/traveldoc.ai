"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, X, Volume2, Loader2, Bot, RefreshCw } from "lucide-react";

type AgentState = "idle" | "listening" | "processing" | "speaking";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => ISpeechRecognition;
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
interface ISpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function VoiceAgent() {
  const [open, setOpen] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [history, setHistory] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(false);
  const [continuous, setContinuous] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const continuousRef = useRef(false);
  const historyRef = useRef<Message[]>([]);
  const stateRef = useRef<AgentState>("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRec: SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSupported(!!SpeechRec && !!window.speechSynthesis);
    }
  }, []);

  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);
  useEffect(() => { stateRef.current = agentState; }, [agentState]);

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    setAgentState("speaking");
    stateRef.current = "speaking";
    utt.onend = () => {
      if (continuousRef.current) {
        // Auto-listen in continuous mode
        setTimeout(() => startListening(), 300);
      } else {
        setAgentState("idle");
        stateRef.current = "idle";
      }
    };
    window.speechSynthesis.speak(utt);
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec: SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    setError("");
    setTranscript("");
    setAgentState("listening");
    stateRef.current = "listening";

    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setAgentState("processing");
      stateRef.current = "processing";

      const newHistory: Message[] = [...historyRef.current, { role: "user", content: text }];
      setHistory(newHistory);
      historyRef.current = newHistory;

      try {
        const res = await fetch("/api/voice-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history: historyRef.current.slice(-6) }),
        });
        const data = await res.json();
        if (data.reply) {
          const updated: Message[] = [...historyRef.current, { role: "assistant", content: data.reply }];
          setHistory(updated);
          historyRef.current = updated;
          setReply(data.reply);
          speak(data.reply);
        } else {
          setAgentState("idle");
        }
      } catch {
        setError("Could not reach AI. Check your connection.");
        setAgentState("idle");
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Microphone permission denied.");
        setAgentState("idle");
        setContinuous(false);
      } else if (event.error === "no-speech" && continuousRef.current) {
        // Retry silently in continuous mode
        setTimeout(() => startListening(), 500);
      } else {
        setAgentState("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setAgentState("idle");
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setAgentState("idle");
  }

  function toggleContinuous() {
    const next = !continuous;
    setContinuous(next);
    continuousRef.current = next;
    if (next && agentState === "idle") {
      startListening();
    } else if (!next) {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
      setAgentState("idle");
    }
  }

  function resetConversation() {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setHistory([]);
    historyRef.current = [];
    setTranscript("");
    setReply("");
    setError("");
    setAgentState("idle");
    setContinuous(false);
    continuousRef.current = false;
    setTimeout(() => {
      speak("Hello! I'm your AI doctor assistant. How can I help you today?");
    }, 200);
  }

  function handleOpen() {
    setOpen(true);
    setTimeout(() => {
      speak("Hello! I'm your AI doctor assistant. How can I help you today?");
    }, 400);
  }

  function handleClose() {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setAgentState("idle");
    setContinuous(false);
    continuousRef.current = false;
    setOpen(false);
    setTranscript("");
    setReply("");
    setError("");
    setHistory([]);
    historyRef.current = [];
  }

  if (!supported) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          title="AI Voice Doctor Assistant"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition-all hover:scale-110 flex items-center justify-center"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Voice panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${continuous ? "bg-green-400 animate-pulse" : "bg-green-400"}`} />
              <span className="text-white font-semibold text-sm">AI Doctor Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetConversation} title="New conversation" className="text-white/70 hover:text-white transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3 min-h-[180px]">
            {/* Continuous mode toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-gray-600">Continuous conversation</span>
              <button
                onClick={toggleContinuous}
                className={`relative w-10 h-5 rounded-full transition-colors ${continuous ? "bg-brand-600" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${continuous ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* State feedback */}
            <div className="text-center py-1">
              {agentState === "idle" && !reply && (
                <p className="text-sm text-gray-400">Press mic to ask anything</p>
              )}
              {agentState === "listening" && (
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1.5">
                    {[1, 2, 3, 4, 3, 2].map((h, i) => (
                      <div key={i} className="w-1 rounded-full bg-brand-500"
                        style={{ height: `${h * 5}px`, animation: "bounce 0.6s infinite", animationDelay: `${i * 0.08}s` }} />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-brand-600">Listening...</p>
                </div>
              )}
              {agentState === "processing" && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                  <p className="text-sm text-gray-500">Thinking...</p>
                </div>
              )}
              {agentState === "speaking" && (
                <div className="flex items-center justify-center gap-2">
                  <Volume2 className="w-4 h-4 text-brand-600 animate-pulse" />
                  <p className="text-sm font-medium text-brand-600">Speaking...</p>
                </div>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-xs text-gray-400 font-medium mb-1">You</p>
                <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
              </div>
            )}

            {/* Reply */}
            {reply && (
              <div className="bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-brand-500 font-medium">AI Assistant</p>
                  {agentState === "idle" && reply && (
                    <button onClick={() => speak(reply)} className="text-xs text-brand-400 hover:text-brand-600 flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Replay
                    </button>
                  )}
                </div>
                <p className="text-sm text-brand-800 leading-relaxed">{reply}</p>
              </div>
            )}

            {history.length > 2 && (
              <p className="text-xs text-gray-400 text-center">{Math.floor(history.length / 2)} exchanges in this conversation</p>
            )}

            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          </div>

          {/* Controls */}
          <div className="px-4 pb-4 flex flex-col items-center gap-2">
            {agentState === "idle" || agentState === "processing" ? (
              <button onClick={startListening} disabled={agentState === "processing"}
                className="w-14 h-14 rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center shadow-lg transition-all hover:scale-105">
                <Mic className="w-6 h-6" />
              </button>
            ) : agentState === "listening" ? (
              <button onClick={stopListening}
                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg animate-pulse">
                <MicOff className="w-6 h-6" />
              </button>
            ) : (
              <button onClick={stopSpeaking}
                className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg hover:bg-amber-600">
                <Volume2 className="w-6 h-6" />
              </button>
            )}
            <p className="text-xs text-gray-400 text-center">
              {continuous ? "Auto-listening after each reply" : "Any language • Powered by Groq AI"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
