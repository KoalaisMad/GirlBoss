// Voice control page
// honestly this is pretty cool - you can just talk to it
// still trying to figure out how to make the animation smoother tho

"use client";

import { useState } from "react";
import { Menu, Mic, Phone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navigation from "../components/Navigation";

export default function VoiceAssistantPage() {
  const router = useRouter();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    setIsListening(!isListening);
    // TODO: actually hook this up to voice recognition lol
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-300 to-pink-400 flex flex-col">
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
          <Menu className="w-6 h-6 text-white" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-900">
          Voice Agent
        </h1>
        <p className="text-center text-gray-700 text-sm mb-12">
          Tap the mic for immediate assistance
        </p>

        {/* Voice Animation Circle */}
        <div className="relative mb-16">
          <button
            onClick={toggleListening}
            className="relative w-64 h-64 rounded-full bg-gradient-to-br from-white/40 to-white/60 flex items-center justify-center transition-all duration-300 shadow-2xl"
          >
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                <div className="absolute inset-8 rounded-full bg-white/20 animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-8">
          <button className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
            <Mic className="w-8 h-8 text-pink-500" />
          </button>
          <button className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
            <Phone className="w-8 h-8 text-pink-500" />
          </button>
        </div>
      </main>
    </div>
  );
}
