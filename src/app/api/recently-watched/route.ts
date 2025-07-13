import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { item_id, type } = await request.json();

    if (!item_id || !type || (type !== "movie" && type !== "tv")) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: insertError } = await supabase
      .from("recently_watched")
      .insert({
        user_id: user.id,
        item_id,
        type,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Recently watched recorded" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
