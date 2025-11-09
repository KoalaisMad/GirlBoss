import { connectToMongoDB } from "@/backend/src/config/db";
import User from "@/models/User";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await connectToMongoDB();
  const user = await User.findById(params.id);
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(user);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await connectToMongoDB();
  const body = await req.json();
  const user = await User.findByIdAndUpdate(params.id, body, { new: true });
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(user);
}