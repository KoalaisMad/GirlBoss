"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NavigationMenu from "@/app/components/Navigation";

export default function Header() {
  const router = useRouter();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <>
      <NavigationMenu isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      <header className="flex items-center justify-between px-8 lg:px-24 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/')} 
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Image
              src="/girlboss.png"
              alt="GirlBoss Logo"
              width={150}
              height={150}
              className="rounded-lg"
            />
          </button>
        </div>
        <button 
          onClick={() => setIsNavOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </header>
    </>
  );
}

