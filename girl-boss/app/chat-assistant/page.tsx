// Chat page - AI Safety Assistant powered by Google Gemini

"use client";

import { useState, useEffect } from "react";
import { Menu, Send, MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navigation from "../components/Navigation";
import { sendChatMessage } from "@/lib/api";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatbotPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your personal safety assistant. I can help with:\n\n• Safety advice based on your location and time\n• Finding safe spaces nearby\n• Travel safety tips for walking, driving, or public transit\n• Emergency guidance\n\nHow can I help you stay safe today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);

  // Get user's location when page loads
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: "Current Location",
          };

          // Try to get location name from reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lon}`
            );
            const data = await response.json();
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village;
              const state = data.address.state;
              location.name = city && state ? `${city}, ${state}` : "Current Location";
            }
          } catch (err) {
            console.log("Could not get location name:", err);
          }

          setUserLocation(location);
          console.log("📍 User location:", location);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Send messages to the AI with location context
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // add user's message first
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Send message with location context
      const response = await sendChatMessage({ 
        message: inputMessage,
        location: userLocation?.name,
        lat: userLocation?.lat,
        lon: userLocation?.lon,
      });
      
      // then add the bot's response
      const botResponse: Message = {
        id: messages.length + 2,
        text: response.message,
        sender: "bot",
        timestamp: new Date(response.timestamp),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      // show error if backend is down or something
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Sorry, I'm having trouble connecting right now. Please make sure the backend server is running on port 4000.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-8 flex flex-col pb-4">
        <h1 className="text-4xl font-semibold pt-12 mb-2 text-center">
          <span className="text-gray-900">Safety Assistant</span>
        </h1>
        <p className="text-center text-pink-400 mb-4">
          AI-powered safety advice
        </p>


        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl ${
                  message.sender === "user"
                    ? "bg-pink-400 text-white rounded-br-sm"
                    : "bg-gray-200 text-gray-900 rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
                <p className={`text-xs mt-1 ${message.sender === "user" ? "text-pink-100" : "text-gray-500"}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="pb-6 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="p-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
