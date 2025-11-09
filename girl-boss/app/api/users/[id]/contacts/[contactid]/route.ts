import { connectToMongoDB } from "@/backend/src/config/db";
import User from "@/models/User";
import { Types } from "mongoose";

export async function PATCH(req: Request, { params }: { params: { id: string; contactId: string } }) {
  await connectToMongoDB();
  const update = await req.json();

  const user = await User.findOneAndUpdate(
    { _id: params.id, "contacts._id": new Types.ObjectId(params.contactId) },
    { $set: Object.fromEntries(Object.entries(update).map(([k, v]) => [`contacts.$.${k}`, v])) },
    { new: true }
  );
  if (!user) return new Response("Not found", { status: 404 });
  const updated = user.contacts.id(params.contactId);
  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string; contactId: string } }) {
  await connectToMongoDB();
  const user = await User.findByIdAndUpdate(
    params.id,
    { $pull: { contacts: { _id: params.contactId } } },
    { new: true }
  );
  if (!user) return new Response("Not found", { status: 404 });
  return new Response(null, { status: 204 });
}