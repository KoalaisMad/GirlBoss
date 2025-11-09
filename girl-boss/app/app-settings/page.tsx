// Settings page - pretty basic stuff
// just forms for name, email, emergency contacts
// TODO: hook this up to the backend API

// "use client";

// import { useState } from "react";
// import { Menu, X } from "lucide-react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useSession } from "next-auth/react";
// import Navigation from "../components/Navigation";
// import { addContact } from "@/lib/contact"; //adding the contact here

// interface EmergencyContact {
//   name: string;
//   phone: string;
//   initials: string;
//   color: string;
// }

// export default function SettingsPage({ userId }: { userId: string }) {
//   const router = useRouter();
//   const { data: session } = useSession();
//   const [isNavOpen, setIsNavOpen] = useState(false);
//   const [showAddContact, setShowAddContact] = useState(false);
//   const [newContactName, setNewContactName] = useState(""); //updates newContactName
//   const [newContactPhone, setNewContactPhone] = useState(""); //updates newContactPhone
//   const [contact, setContact] = useState({ name: "", phone: "" });
  
//   // emergency contacts list
//   // const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
//   //   { name: "Ran Zhou", phone: "(987) 654 3210", initials: "RZ", color: "bg-pink-200" },
//   //   { name: "Mom", phone: "(123) 456 7890", initials: "M", color: "bg-purple-200" },
//   //   { name: "Grandma", phone: "(987) 654 3211", initials: "GR", color: "bg-pink-300" },
//   // ]);

//   // get initials from name
//   const getInitials = (name: string) => {
//     const words = name.trim().split(' ');
//     if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
//     return (words[0][0] + words[words.length - 1][0]).toUpperCase();
//   };

//   // random color for avatar
//   const getRandomColor = () => {
//     const colors = [
//       "bg-pink-200", "bg-purple-200", "bg-pink-300", 
//       "bg-purple-300", "bg-pink-400", "bg-rose-200"
//     ];
//     return colors[Math.floor(Math.random() * colors.length)];
//   };

//   // add new contact
//   const handleAddContact = () => {
//     if (newContactName.trim() && newContactPhone.trim()) {
//       const newContact: EmergencyContact = {
//         name: newContactName.trim(),
//         phone: newContactPhone.trim(),
//         initials: getInitials(newContactName),
//         color: getRandomColor(),
//       };
//       setEmergencyContacts([...emergencyContacts, newContact]);
//       setNewContactName("");
//       setNewContactPhone("");
//       setShowAddContact(false);
//     }
//   };

//   // remove contact
//   const handleRemoveContact = (index: number) => {
//     setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
//       {/* Header */}
//       <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
//         <button onClick={() => router.push('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
//           <Image
//             src="/girlboss.png"
//             alt="GirlBoss Logo"
//             width={150}
//             height={150}
//             className="rounded-lg"
//           />
//         </button>
//         <button 
//           onClick={() => setIsNavOpen(true)}
//           className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//         >
//           <Menu className="w-6 h-6 text-gray-700" />
//         </button>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-2xl mx-auto px-6 py-8">
//         <h1 className="text-3xl font-bold mb-2 text-center">
//           <span className="text-gray-900">Settings</span>
//         </h1>
//         <p className="text-center text-gray-500 text-sm mb-8">
//           Manage your account
//         </p>

//         {/* Name Field */}
//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
//           <input
//             type="text"
//             value={session?.user?.name || ""}
//             placeholder="Your Name"
//             readOnly
//             className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
//           />
//         </div>

//         {/* Email Field */}
//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
//           <input
//             type="email"
//             value={session?.user?.email || ""}
//             placeholder="your.email@example.com"
//             readOnly
//             className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
//           />
//         </div>

//         {/* Emergency Contacts */}
//         <div className="mb-6">
//           <div className="flex items-center justify-between mb-3">
//             <label className="block text-sm font-medium text-gray-700">Emergency Contacts</label>
//             <button 
//               onClick={() => setShowAddContact(!showAddContact)}
//               className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center text-xl hover:bg-pink-600 transition-colors"
//             >
//               {showAddContact ? '−' : '+'}
//             </button>
//           </div>

//           {/* Add Contact Form */}
//           {showAddContact && (
//             <div className="mb-4 p-4 bg-pink-50 rounded-xl border-2 border-pink-200">
//               <h3 className="font-semibold text-gray-900 mb-3">Add New Emergency Contact</h3>
//               <div className="space-y-3">
//                 <input
//                   type="text"
//                   placeholder="Contact Name"
//                   value={newContactName}
//                   onChange={(e) => setNewContactName(e.target.value)}
//                   className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
//                 />
//                 <input
//                   type="tel"
//                   placeholder="Phone Number"
//                   value={newContactPhone}
//                   onChange={(e) => setNewContactPhone(e.target.value)}
//                   className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
//                 />
//                 <div className="flex gap-2">
//                   <button
//                     onClick={handleAddContact}
//                     disabled={!newContactName.trim() || !newContactPhone.trim()}
//                     className="flex-1 py-2 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     Add Contact
//                   </button>
//                   <button
//                     onClick={() => {
//                       setShowAddContact(false);
//                       setNewContactName("");
//                       setNewContactPhone("");
//                     }}
//                     className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Contact List */}
//           <div className="space-y-3">
//             {emergencyContacts.map((contact, index) => (
//               <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
//                 <div className={`w-10 h-10 ${contact.color} rounded-full flex items-center justify-center font-bold text-white`}>
//                   {contact.initials}
//                 </div>
//                 <div className="flex-1">
//                   <p className="font-semibold text-gray-900">{contact.name}</p>
//                   <p className="text-sm text-gray-500">{contact.phone}</p>
//                 </div>
//                 <button
//                   onClick={() => handleRemoveContact(index)}
//                   className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
//                   title="Remove contact"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//             ))}
//             {emergencyContacts.length === 0 && (
//               <p className="text-center text-gray-400 py-8">No emergency contacts yet. Add one above!</p>
//             )}
//           </div>
//         </div>

//         {/* Save Changes Button */}
//         <button className="w-full py-4 bg-gray-300 text-gray-600 rounded-2xl font-semibold hover:bg-gray-400 transition-colors">
//           Save Changes
//         </button>
//       </main>
//     </div>
//   );
// }



"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navigation from "../components/Navigation";
import { upsertUser, getUser, addContact, deleteContact } from "@/lib/contact";

type Contact = { _id: string; name: string; phone: string };

type UIContact = Contact & { initials: string; color: string };

export default function SettingsPage({ userId: userIdProp }: { userId?: string }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const [userId, setUserId] = useState<string | undefined>(userIdProp);
  const [contacts, setContacts] = useState<UIContact[]>([]);
  const loadingRef = useRef(false);

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
      if (!email) return; // not logged in yet

      // your upsertUser(name, email)
      const user = await upsertUser(fullName, email).catch(() => null);
      if (user?._id) setUserId(user._id);
    })();
  }, [session?.user?.email, session?.user?.name]);

  const canSubmit = Boolean(
    userId && newContactName.trim() && newContactPhone.trim()
  );

  // ----------------- load contacts when userId is available -----------------
  useEffect(() => {
    if (!userId || loadingRef.current) return;
    loadingRef.current = true;
    
    getUser(userId)
      .then(user => {
        if (user?.emergencyContacts) {
          setContacts(decorate(user.emergencyContacts));
        }
      })
      .catch(err => console.error("Failed to load contacts:", err))
      .finally(() => { loadingRef.current = false; });
  }, [userId]);

  // ----------------- add contact -----------------
  const handleAddContact = async () => {
    try {
      if (!userId) throw new Error("Missing userId");
      const updated = await addContact(userId, {
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
      });
      setContacts(decorate(updated));
      setNewContactName("");
      setNewContactPhone("");
      setShowAddContact(false);
    } catch (e: any) {
      console.error("Add contact failed:", e?.message || e);
      alert(e?.message || "Failed to add contact");
    }
  };

  // ----------------- delete contact -----------------
  const handleRemoveContact = async (contactId: string) => {
    if (!userId) return;
    await deleteContact(userId, contactId).catch(() => null);
    setContacts(prev => prev.filter(c => c._id !== contactId));
  };

  // read-only session fields for display
  const sessionName = session?.user?.name || "";
  const sessionEmail = session?.user?.email || "";

  return (
    <div className="min-h-screen bg-white">
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
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
      <main className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-semibold mb-2 text-center">
          <span className="text-gray-900">Settings</span>
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">Manage your account</p>

        {/* Name Field */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={sessionName}
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
            value={sessionEmail}
            placeholder="your.email@example.com"
            readOnly
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
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
