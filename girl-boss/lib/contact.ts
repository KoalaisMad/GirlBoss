// //const BASE = process.env.NEXT_PUBLIC_API_URL!;
// //const BASE = "";
// //const BASE = "http://localhost:4000/api"
// const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// export async function upsertUser(name: string, email: string) {
//   const r = await fetch(`${BASE}/users`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ name, email }),
//   });
//   if (!r.ok) throw new Error(await r.text());
//   return r.json(); // returns user { _id, email, contacts: [] }
// }

// export async function getUser(id: string) {
//   const r = await fetch(`${BASE}/users/${id}`);
//   if (!r.ok) throw new Error(await r.text());
//   return r.json();
// }

// export async function addContact(id: string, contact: { name: string; phone: string }) {
//   const r = await fetch(`${BASE}/users/${id}/contacts`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(contact),
//   });
//   const txt = await r.text();
//   if (!r.ok) throw new Error(txt || `HTTP ${r.status}`);
//   return JSON.parse(txt) as Array<{ _id: string; name: string; phone: string }>;
// }

// export async function updateContact(id: string, contactid: string, patch: Record<string, unknown>) {
//   const r = await fetch(`${BASE}/users/${id}/contacts/${contactid}`, {
//     method: "PATCH",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(patch),
//   });
//   if (!r.ok) throw new Error(await r.text());
//   return r.json(); // returns updated contact
// }

// export async function deleteContact(id: string, contactid: string) {
//   const r = await fetch(`${BASE}/users/${id}/contacts/${contactid}`, { method: "DELETE" });
//   if (!r.ok) throw new Error(await r.text());
// }

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function upsertUser(name: string, email: string) {
  const r = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // returns user { _id, name, email, emergencyContacts, preferences }
}

export async function getUser(id: string) {
  const r = await fetch(`${BASE}/users/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getUserByEmail(email: string) {
  const r = await fetch(`${BASE}/users/email/${encodeURIComponent(email)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function addContact(id: string, contact: { name: string; phone: string }) {
  const r = await fetch(`${BASE}/users/${id}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });

  if (!r.ok) throw new Error(await r.text());

  return r.json(); // returns { message, contacts: [...] }
}

export async function getUserProfile(id: string) {
  const r = await fetch(`${BASE}/users/${id}/profile`);
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // returns full profile with MCP context
}

export async function updateUser(id: string, updates: Record<string, unknown>) {
  const r = await fetch(`${BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateContact(
  userId: string,
  contactId: string,
  patch: Partial<{ name: string; phone: string }>
) {
  const r = await fetch(`${BASE}/users/${userId}/contacts/${contactId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // returns the updated contact
}

export async function deleteContact(userId: string, contactId: string) {
  const r = await fetch(`${BASE}/users/${userId}/contacts/${contactId}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // returns { message, contacts: [...] }
}

// ========== EMAIL-BASED FUNCTIONS (Simpler!) ==========

export async function addContactByEmail(email: string, contact: { name: string; phone: string }) {
  const r = await fetch(`${BASE}/users/email/${encodeURIComponent(email)}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // returns { message, contacts: [...] }
}

export async function deleteContactByEmail(email: string, contactId: string) {
  const r = await fetch(`${BASE}/users/email/${encodeURIComponent(email)}/contacts/${contactId}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // returns { message, contacts: [...] }
}