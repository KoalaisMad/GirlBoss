// Voice control page
// honestly this is pretty cool - you can just talk to it
// still trying to figure out how to make the animation smoother tho

"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, Mic, Phone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navigation from "../components/Navigation";

// Define types for speech recognition
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceAssistantPage() {
  const router = useRouter();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Tap the mic for immediate assistance");
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognitionConstructor = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = async (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setStatus(`You said: "${text}"`);
        setIsListening(false);
        
        // Send to chat API
        await sendToChat(text);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setStatus("Error: Could not understand. Try again.");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const sendToChat = async (text: string) => {
    setIsProcessing(true);
    setStatus("Processing your request...");

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const replyText = data.message;
      console.log("📝 AI Response:", replyText);

      // Use browser's built-in speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(replyText);
        
        // Configure voice (female, US English)
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => 
          v.lang.startsWith('en') && v.name.includes('Female')
        ) || voices.find(v => v.lang.startsWith('en'));
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        setStatus("Speaking response...");

        utterance.onend = () => {
          console.log("✅ Speech finished");
          setStatus("Tap the mic for immediate assistance");
          setIsProcessing(false);
        };

        utterance.onerror = (event) => {
          console.error("❌ Speech error:", event);
          setStatus("Error speaking response");
          setIsProcessing(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback: just show the text
        console.warn("Speech synthesis not supported");
        setStatus(replyText);
        setIsProcessing(false);
      }

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setStatus(`Error: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setStatus("Speech recognition not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus("Tap the mic for immediate assistance");
    } else {
      setTranscript("");
      setIsListening(true);
      setStatus("Listening...");
      recognitionRef.current.start();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button onClick={() => router.push('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
          <Image
            src="/girlboss.png"
            alt="GirlBoss Logo"
            width={150}
            height={150}
            className="rounded-lg"
          />
        </button>
        <button 
          onClick={() => setIsNavOpen(true)}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center pt-12 px-6">
        <h1 className="text-4xl font-semibold mb-4 text-center text-gray-900">
          Voice Agent
        </h1>
        <p className="text-center text-pink-400 mb-12 min-h-[28px]">
          {status}
        </p>

        {/* Voice Animation Circle */}
        <div className="relative mb-16">
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className="relative w-64 h-64 rounded-full border bg-gradient-to-br from-white/40 to-white/60 flex items-center justify-center transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
          >
            {(isListening || isProcessing) && (
              <>
                <div className="absolute inset-0 rounded-full bg-pink-300/30 animate-ping" />
                <div className="absolute inset-8 rounded-full bg-pink-200/20 animate-pulse" />
              </>
            )}
            <Mic className={`w-20 h-20 ${isListening ? "text-pink-500" : isProcessing ? "text-pink-400" : "text-gray-400"} transition-colors`} />
          </button>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="mb-8 px-6 py-4 bg-white/50 rounded-lg border border-pink-200 max-w-md">
            <p className="text-sm text-gray-600 mb-1 font-semibold">You said:</p>
            <p className="text-gray-900">&ldquo;{transcript}&rdquo;</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-8">
          <button 
            onClick={toggleListening}
            disabled={isProcessing}
            className="w-16 h-16 bg-white rounded-full border flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mic className={`w-8 h-8 ${isListening ? "text-pink-500" : "text-pink-400"}`} />
          </button>
          <button 
            onClick={() => router.push("/chat-assistant")}
            className="w-16 h-16 bg-white rounded-full flex border items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            <Phone className="w-8 h-8 text-pink-500" />
          </button>
        </div>
      </main>
    </div>
  );
}
