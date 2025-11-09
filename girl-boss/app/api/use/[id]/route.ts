import { connectToMongoDB } from "@/backend/src/config/db";
import User from "@/models/User";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToMongoDB();
  const { id } = await params;
  const user = await User.findById(id);
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(user);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectToMongoDB();
  const { id } = await params;
  const body = await req.json();
  const user = await User.findByIdAndUpdate(id, body, { new: true });
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(user);
}