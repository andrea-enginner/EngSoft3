"use client";

import { createClient } from "@/lib/supabase/client";

export async function loginComGoogle() {
  const supabase = createClient();

  const redirectTo =
    `${window.location.origin}/auth/callback?next=/feed`;

  const { error } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

  if (error) {
    throw new Error(
      "Não foi possível entrar com o Google.",
    );
  }
}