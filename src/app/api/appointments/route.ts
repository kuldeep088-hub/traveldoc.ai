import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appointments: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appointment: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { doctor_id, doctor_name, date, time, notes } = body;

  if (!doctor_id || !date || !time) {
    return NextResponse.json(
      { error: "doctor_id, date, and time are required" },
      { status: 400 }
    );
  }

  // Upsert doctor stub so the foreign key is satisfied
  await supabase.from("doctors").upsert(
    {
      id: doctor_id,
      google_place_id: doctor_id,
      name: doctor_name ?? "Unknown Doctor",
      specialty: [],
      address: "",
      city: "",
      languages: [],
    },
    { onConflict: "google_place_id", ignoreDuplicates: true }
  );

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      doctor_id,
      user_id: user.id,
      date,
      time,
      notes: notes ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appointment: data }, { status: 201 });
}
