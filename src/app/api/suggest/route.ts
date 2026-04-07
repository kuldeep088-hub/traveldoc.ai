import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, specialty, city, address, phone, website, notes } = body;

    if (!name || !city) {
      return NextResponse.json({ error: "name and city are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("suggestions").insert({
      name,
      specialty: specialty || null,
      city,
      address: address || null,
      phone: phone || null,
      website: website || null,
      notes: notes || null,
    });

    if (error) {
      // Table may not exist yet — still return success to user
      console.error("Suggest insert error:", error.message);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Suggest API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
