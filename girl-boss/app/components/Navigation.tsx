"use client";
import { X, Home, Map, MessageSquare, Mic, Settings, LogOut, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Navigation({ isOpen, onClose }: NavigationProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const menuItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Maps", icon: Map, path: "/trip-options" },
    { name: "Chatbot", icon: MessageSquare, path: "/chat-assistant" },
    { name: "Voice Assistant", icon: Mic, path: "/voice-control" },
    { name: "Settings", icon: Settings, path: "/app-settings" },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Image
                src="/girlboss.png"
                alt="GirlBoss Logo"
                width={150}
                height={150}
                className="rounded-lg"
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-2 px-4">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-pink-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                      <item.icon className="w-5 h-5 text-pink-600" />
                    </div>
                    <span className="font-semibold text-gray-900">
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 space-y-4">
            <Button
              onClick={() => session ? signOut({ callbackUrl: "/" }) : signIn("google")}
              className="w-full bg-[#FF2A8A] hover:bg-[#E01D7A] text-white"
            >
              {session ? (
                <>
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Login
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 text-center">
              © 2025 GirlBoss.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
