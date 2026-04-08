import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const doctorOsmId = req.nextUrl.searchParams.get("doctor_osm_id");
  if (!doctorOsmId) {
    return NextResponse.json({ error: "doctor_osm_id is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: reviews, error } = await supabase
    .from("doctor_reviews")
    .select("*")
    .eq("doctor_osm_id", doctorOsmId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const avg =
    reviews && reviews.length > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : null;

  // Also get the current user's review if logged in
  const { data: { user } } = await supabase.auth.getUser();
  const userReview = user ? reviews?.find((r) => r.user_id === user.id) ?? null : null;

  return NextResponse.json({
    reviews: reviews ?? [],
    avg_rating: avg,
    total: reviews?.length ?? 0,
    user_review: userReview,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });
  }

  const body = await req.json();
  const { doctor_osm_id, rating, review_text } = body;

  if (!doctor_osm_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "doctor_osm_id and rating (1-5) are required" }, { status: 400 });
  }

  // Upsert review (one per user per doctor)
  const { error: reviewError } = await supabase
    .from("doctor_reviews")
    .upsert(
      { doctor_osm_id, user_id: user.id, rating, review_text: review_text ?? null },
      { onConflict: "doctor_osm_id,user_id" }
    );

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  // Recalculate and denormalize avg rating back to doctors table (via service role)
  const { data: allReviews } = await supabase
    .from("doctor_reviews")
    .select("rating")
    .eq("doctor_osm_id", doctor_osm_id);

  if (allReviews && allReviews.length > 0) {
    const newAvg = parseFloat(
      (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    );
    const admin = createAdminClient();
    await admin
      .from("doctors")
      .update({ rating: newAvg, reviews_count: allReviews.length })
      .eq("google_place_id", doctor_osm_id);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctorOsmId = req.nextUrl.searchParams.get("doctor_osm_id");
  if (!doctorOsmId) {
    return NextResponse.json({ error: "doctor_osm_id is required" }, { status: 400 });
  }

  await supabase
    .from("doctor_reviews")
    .delete()
    .eq("doctor_osm_id", doctorOsmId)
    .eq("user_id", user.id);

  // Recalculate avg after deletion
  const { data: remaining } = await supabase
    .from("doctor_reviews")
    .select("rating")
    .eq("doctor_osm_id", doctorOsmId);

  const admin = createAdminClient();
  if (!remaining || remaining.length === 0) {
    await admin
      .from("doctors")
      .update({ rating: null, reviews_count: 0 })
      .eq("google_place_id", doctorOsmId);
  } else {
    const newAvg = parseFloat(
      (remaining.reduce((s, r) => s + r.rating, 0) / remaining.length).toFixed(1)
    );
    await admin
      .from("doctors")
      .update({ rating: newAvg, reviews_count: remaining.length })
      .eq("google_place_id", doctorOsmId);
  }

  return NextResponse.json({ success: true });
}
