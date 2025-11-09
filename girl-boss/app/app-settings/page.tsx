// Settings page - pretty basic stuff
// just forms for name, email, emergency contacts
// TODO: hook this up to the backend API

"use client";

import { useState } from "react";
import { Menu, X, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "../components/Navigation";

interface EmergencyContact {
  name: string;
  phone: string;
  initials: string;
  color: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  
  // emergency contacts list
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "Ran Zhou", phone: "(987) 654 3210", initials: "RZ", color: "bg-pink-200" },
    { name: "Mom", phone: "(123) 456 7890", initials: "M", color: "bg-purple-200" },
    { name: "Grandma", phone: "(987) 654 3211", initials: "GR", color: "bg-pink-300" },
  ]);

  // get initials from name
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // random color for avatar
  const getRandomColor = () => {
    const colors = [
      "bg-pink-200", "bg-purple-200", "bg-pink-300", 
      "bg-purple-300", "bg-pink-400", "bg-rose-200"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // add new contact
  const handleAddContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      const newContact: EmergencyContact = {
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
        initials: getInitials(newContactName),
        color: getRandomColor(),
      };
      setEmergencyContacts([...emergencyContacts, newContact]);
      setNewContactName("");
      setNewContactPhone("");
      setShowAddContact(false);
    }
  };

  // remove contact
  const handleRemoveContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
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
      <main className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-semibold mb-2 text-center">
          <span className="text-gray-900">Settings</span>
        </h1>
        <p className="text-center text-pink-400 mb-8">
          Manage your account
        </p>

        {/* Name Field */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={session?.user?.name || ""}
            placeholder="Your Name"
            readOnly
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Email Field */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={session?.user?.email || ""}
            placeholder="your.email@example.com"
            readOnly
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Emergency Contacts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-lg font-medium text-gray-700">Emergency Contacts</label>
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
              <DialogTrigger asChild>
                <button className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Add Emergency Contact</DialogTitle>
                  <DialogDescription>
                    Add a new emergency contact. They will be notified if you need help.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 ">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Contact Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(123) 456-7890"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddContact(false);
                      setNewContactName("");
                      setNewContactPhone("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddContact}
                    disabled={!newContactName.trim() || !newContactPhone.trim()}
                    className="bg-pink-500 hover:bg-pink-600"
                  >
                    Add Contact
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Contact List */}
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 ${contact.color} rounded-full flex items-center justify-center font-bold text-white`}>
                  {contact.initials}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.phone}</p>
                </div>
                <button
                  onClick={() => handleRemoveContact(index)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remove contact"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            {emergencyContacts.length === 0 && (
              <p className="text-center text-gray-400 py-8">No emergency contacts yet. Add one above!</p>
            )}
          </div>
        </div>

        {/* Save Changes Button */}
        <Button className="w-full py-4 bg-gray-300 text-gray-600 hover:bg-gray-400">
          Save Changes
        </Button>
      </main>
    </div>
  );
}
