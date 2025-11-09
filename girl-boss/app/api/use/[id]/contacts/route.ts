import { NextResponse as Response } from "next/server";
import { connectToMongoDB } from "@/backend/src/config/db";
import User from "@/models/User";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToMongoDB();
  const { id } = await params;
  const user = await User.findById(id, { contacts: 1 });
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(user.contacts);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToMongoDB();
  const { id } = await params;
  const { name, phone } = await req.json();
  if (!name || !phone)
    return new Response(JSON.stringify({ error: "name and phone required" }), { status: 400 });

  const user = await User.findByIdAndUpdate(
    id,
    { $push: { contacts: { name, phone } } },
    { new: true, runValidators: true, projection: { contacts: 1 } }
  );
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(user.contacts);
}