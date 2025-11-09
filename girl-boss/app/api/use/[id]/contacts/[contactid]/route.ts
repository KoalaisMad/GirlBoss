import { connectToMongoDB } from "@/backend/src/config/db";
import User from "@/models/User";
import { Types } from "mongoose";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; contactid: string }> }) {
  await connectToMongoDB();
  const { id, contactid } = await params;
  const update = await req.json();

  const user = await User.findOneAndUpdate(
    { _id: id, "contacts._id": new Types.ObjectId(contactid) },
    { $set: Object.fromEntries(Object.entries(update).map(([k, v]) => [`contacts.$.${k}`, v])) },
    { new: true }
  );
  if (!user) return new Response("Not found", { status: 404 });
  const updated = user.contacts.id(contactid);
  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; contactid: string }> }) {
  await connectToMongoDB();
  const { id, contactid } = await params;
  const user = await User.findByIdAndUpdate(
    id,
    { $pull: { contacts: { _id: contactid } } },
    { new: true }
  );
  if (!user) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}