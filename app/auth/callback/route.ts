import { createClient } from "@/lib/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const access_token = requestUrl.hash
    ?.split("access_token=")[1]
    ?.split("&")[0];

  if (access_token) {
    // Redirect directly to the password configuration page with the token
    return NextResponse.redirect(
      new URL(`/set-password?token=${access_token}`, request.url)
    );
  }

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/campanias", request.url));
}
