"use client";

import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navigation from "../components/Navigation";
// Settings page - pretty basic stuff
// just forms for name, email, emergency contacts
// TODO: hook this up to the backend API

// "use client";

// import { useState } from "react";
// import { Menu, X } from "lucide-react";
// import Image from "next/image";

import { upsertUser, addContactByEmail, deleteContactByEmail } from "@/lib/contact";


type Contact = { _id: string; name: string; phone: string };


type UIContact = Contact & { initials: string; color: string };


export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();


  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");


  const [contacts, setContacts] = useState<UIContact[]>([]);
  const [userStatus, setUserStatus] = useState<string>("");


  // ----------------- UI helpers -----------------
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };


  const getRandomColor = () => {
    const colors = ["bg-pink-200","bg-purple-200","bg-pink-300","bg-purple-300","bg-pink-400","bg-rose-200"];
    return colors[Math.floor(Math.random() * colors.length)];
  };


  const decorate = (list: Contact[]): UIContact[] =>
    list.map(c => ({
      ...c,
      initials: getInitials(c.name),
      color: getRandomColor(),
    }));


  // ----------------- bootstrap: ensure user + load contacts -----------------
  useEffect(() => {
    (async () => {
      const fullName = session?.user?.name?.trim() ?? "";
      const email    = session?.user?.email?.trim()?.toLowerCase() ?? "";
      if (!email) {
        setUserStatus("Not logged in: no email in session");
        return;
      }
      setUserStatus("Loading user data...");
      try {
        // Create or get user
        const user = await upsertUser(fullName, email);
        console.log("✅ User data loaded for:", email);
        
        // Load existing contacts
        if (user?.emergencyContacts) {
          setContacts(decorate(user.emergencyContacts));
          console.log("✅ Loaded", user.emergencyContacts.length, "contacts");
        }
        setUserStatus("");
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        setUserStatus("Error: " + errorMsg);
        console.error("Failed to load user:", e);
      }
    })();
  }, [session?.user?.email, session?.user?.name]);


  const canSubmit = Boolean(
    session?.user?.email && newContactName.trim() && newContactPhone.trim()
  );


  // ----------------- add contact -----------------
  const handleAddContact = async () => {
    try {
      const email = session?.user?.email;
      if (!email) throw new Error("Not logged in");
      
      console.log("➕ Adding contact");
      console.log("   User email:", email);
      console.log("   Email type:", typeof email);
      console.log("   Encoded:", encodeURIComponent(email));
      const response = await addContactByEmail(email, {
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
      });
      // Response format: { message, contacts: [...] }
      setContacts(decorate(response.contacts || []));
      setNewContactName("");
      setNewContactPhone("");
      setShowAddContact(false);
      console.log("✅ Contact added successfully");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("Add contact failed:", errorMsg);
      alert(errorMsg || "Failed to add contact");
    }
  };


  // ----------------- delete contact -----------------
  const handleRemoveContact = async (contactid: string) => {
    const email = session?.user?.email;
    if (!email) return;
    
    try {
      const response = await deleteContactByEmail(email, contactid);
      setContacts(decorate(response.contacts || []));
      console.log("✅ Contact deleted successfully");
    } catch (e) {
      console.error("Failed to delete contact:", e);
      // Still remove from UI even if backend fails
      setContacts(prev => prev.filter(c => c._id !== contactid));
    }
  };


  // read-only session fields for display
  const sessionName = session?.user?.name || "";
  const sessionEmail = session?.user?.email || "";


  return (
    <div className="min-h-screen bg-white">
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />


      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <button onClick={() => router.push('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
          <Image src="/girlboss.png" alt="GirlBoss Logo" width={150} height={150} className="rounded-lg" />
        </button>
        <button
          onClick={() => setIsNavOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </header>


      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {userStatus && (
          <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
            {userStatus}
          </div>
        )}
        <h1 className="text-3xl font-bold mb-2 text-center">
          <span className="text-gray-900">Settings</span>
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">Manage your account</p>


        {/* Name Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={sessionName}
            placeholder="Your Name"
            readOnly
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>


        {/* Email Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={sessionEmail}
            placeholder="your.email@example.com"
            readOnly
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>


        {/* Emergency Contacts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Emergency Contacts</label>
            <button
              onClick={() => setShowAddContact(!showAddContact)}
              className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center text-xl hover:bg-pink-600 transition-colors"
            >
              {showAddContact ? '−' : '+'}
            </button>
          </div>


          {/* Add Contact Form */}
          {showAddContact && (
            <div className="mb-4 p-4 bg-pink-50 rounded-xl border-2 border-pink-200">
              <h3 className="font-semibold text-gray-900 mb-3">Add New Emergency Contact</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddContact}
                    disabled={!canSubmit}
                    className="flex-1 py-2 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Contact
                  </button>
                  <button
                    onClick={() => {
                      setShowAddContact(false);
                      setNewContactName("");
                      setNewContactPhone("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Contact List */}
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 ${c.color} rounded-full flex items-center justify-center font-bold text-white`}>
                  {c.initials}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.phone}</p>
                </div>
                <button
                  onClick={() => handleRemoveContact(c._id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remove contact"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-center text-gray-400 py-8">No emergency contacts yet. Add one above!</p>
            )}
          </div>
        </div>


        {/* Save Changes (not required for contacts since we persist immediately) */}
        <button disabled className="w-full py-4 bg-gray-200 text-gray-400 rounded-2xl font-semibold">
          Changes are saved automatically
        </button>
      </main>
    </div>
  );
}


