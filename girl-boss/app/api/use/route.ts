import { connectToMongoDB } from "@/backend/src/config/db";
import User from "@/models/User";

export async function POST(req: Request) {
    await connectToMongoDB();
    const { name, email } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400 });

    const user = await User.findOneAndUpdate(
    { email },
    { $setOnInsert: { name, email } },
    { new: true, upsert: true }
  );
  return Response.json(user);
}


// import { NextResponse } from "next/server";

// export async function GET() {
//   const con = await connectToMongoDB();
//   return new NextResponse('connected');
// }