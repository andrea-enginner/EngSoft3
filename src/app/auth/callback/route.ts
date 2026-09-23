import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code =
    requestUrl.searchParams.get("code");

  const nextParametro =
    requestUrl.searchParams.get("next");

  const next =
    nextParametro?.startsWith("/") &&
    !nextParametro.startsWith("//")
      ? nextParametro
      : "/feed";

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code,
      );

    if (!error) {
      return NextResponse.redirect(
        new URL(next, requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(
    new URL("/login?erro=google", requestUrl.origin),
  );
}