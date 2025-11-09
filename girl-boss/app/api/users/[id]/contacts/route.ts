import { connectToMongoDB } from "@/backend/src/config/db";
import User from "@/models/User";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await connectToMongoDB();
  const user = await User.findById(params.id, { contacts: 1 });
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(user.contacts);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await connectToMongoDB();
  const { name, phone } = await req.json();
  if (!name || !phone)
    return new Response(JSON.stringify({ error: "name and phone required" }), { status: 400 });

  const user = await User.findByIdAndUpdate(
    params.id,
    { $push: { contacts: { name, phone } } },
    { new: true, runValidators: true, projection: { contacts: 1 } }
  );
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(user.contacts);
}