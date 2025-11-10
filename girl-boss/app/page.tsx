"use client";

import { Shield, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Header from "@/components/Header";

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const features = [
    {
      icon: Shield,
      title: "Safety First",
      description: "AI-powered route safety analysis to keep you secure on every journey"
    },
    {
      icon: MapPin,
      title: "Smart Navigation",
      description: "Real-time route optimization with multiple transport options"
    },
    {
      icon: Users,
      title: "Emergency Support",
      description: "Instant emergency contact notifications when you need them most"
    }
  ];

  return (
    <div className="min-h-screen ">
      <Header />

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 sm:mb-6 px-4">
            Safety one step at a time!
          </h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg max-w-2xl px-4">
            Find the safest possible way to travel to your destination
          </p>
          <div className="flex items-center justify-center gap-4 px-4">
            <Button 
              onClick={() => session ? router.push("/home") : signIn("google")}
              disabled={status === "loading"}
              className="bg-[#FF2A8A] text-white hover:bg-[#E01D7A] w-full sm:w-auto px-6 py-3"
            >
              {status === "loading" 
                ? "Loading..." 
                : session 
                  ? "Start your trip" 
                  : "Login with Google"
              }
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-8 lg:px-24 pb-25 bg-white">
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-4">
            Latest technologies are used to maximize user saftey
            </h2>
            <p className="text-gray-600 text-sm md:text-base mx-auto">
              More than just navigation – your personal safety companion for every journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-pink-500 transition-all hover:shadow-xl">
                <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
