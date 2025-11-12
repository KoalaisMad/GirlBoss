// Chat page - AI Safety Assistant powered by Google Gemini

"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import Header from "@/components/Header";
import { sendChatMessage } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your personal safety assistant. I can help with:\n\n• **Safety advice** based on your location and time  \n• **Finding safe spaces** nearby  \n• **Travel safety tips** for walking, driving, or public transit  \n• **Emergency guidance**\n\nHow can I help you stay safe today?",
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const messageText = error instanceof Error
        ? error.message
        : "Sorry, I'm having trouble connecting right now.";
      const errorMessage: Message = {
        id: messages.length + 2,
        text: messageText,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white relative">
      <Header />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full px-8">
        <div className="pt-12 mb-2">
          <h1 className="text-4xl font-semibold text-center mb-2">
            <span className="text-gray-900">Safety Assistant</span>
          </h1>
          <p className="text-center text-pink-400 mb-4">
            AI-powered safety advice
          </p>
        </div>

        {/* Messages Container - Scrollable with bottom padding for fixed input */}
        <div className="space-y-4 pb-20 lg:pb-24">
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
                {message.sender === "bot" ? (
                  <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                )}
                <p className={`text-xs mt-1 ${message.sender === "user" ? "text-pink-100" : "text-gray-500"}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area - Absolute positioned at bottom with z-index */}
      <div className="fixed bottom-0 left-0 right-0 bg-white z-50">
        <div className="max-w-2xl mx-auto w-full px-8 py-4 pb-6 lg:pb-12 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm text-gray-700 placeholder-gray-400"
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
      </div>
    </div>
  );
}
