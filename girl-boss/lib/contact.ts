const BASE = process.env.NEXT_PUBLIC_API_URL!;

export async function upsertUser(name: string, email: string) {
  const r = await fetch(`${BASE}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // returns user { _id, email, contacts: [] }
}

export async function getUser(id: string) {
  const r = await fetch(`${BASE}/api/users/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function addContact(userId: string, contact: { name: string; phone: string }) {
  const r = await fetch(`/api/users/${userId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || `HTTP ${r.status}`);
  return JSON.parse(txt) as Array<{ _id: string; name: string; phone: string }>;
}

export async function updateContact(userId: string, contactId: string, patch: Record<string, unknown>) {
  const r = await fetch(`${BASE}/api/users/${userId}/contacts/${contactId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // returns updated contact
}

export async function deleteContact(userId: string, contactId: string) {
  const r = await fetch(`${BASE}/api/users/${userId}/contacts/${contactId}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
}