import { createFileRoute } from "@tanstack/react-router";
import { verifyOpenIdResponse, fetchSteamProfile } from "@/lib/steam.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Steam OpenID callback. Verifies the OpenID response with Steam, fetches the
 * Steam profile, upserts an auth user + profile row, then redirects the
 * browser back to the SPA with magic-link tokens in the hash so the supabase
 * client picks up the session.
 */
export const Route = createFileRoute("/api/public/steam/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const steamId = await verifyOpenIdResponse(url.searchParams);
        if (!steamId) {
          return new Response(null, { status: 302, headers: { Location: `${origin}/?steam_error=invalid` } });
        }

        let profile = null;
        try {
          profile = await fetchSteamProfile(steamId);
        } catch {
          /* keep going with minimal profile */
        }
        const persona = profile?.personaname ?? `Player ${steamId.slice(-4)}`;
        const avatar = profile?.avatarfull ?? "";
        const profileUrl = profile?.profileurl ?? `https://steamcommunity.com/profiles/${steamId}`;

        const email = `steam_${steamId}@fragmarket.local`;
        // Find or create the auth user
        let userId: string | null = null;
        const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = existing?.users.find((u) => u.email === email);
        if (found) {
          userId = found.id;
        } else {
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { steam_id: steamId, persona, avatar_url: avatar },
          });
          if (createErr || !created.user) {
            console.error("createUser failed", createErr);
            return new Response(null, { status: 302, headers: { Location: `${origin}/?steam_error=createuser` } });
          }
          userId = created.user.id;
        }

        // Upsert profile row
        await supabaseAdmin.from("profiles").upsert(
          {
            id: userId,
            steam_id: steamId,
            persona,
            avatar_url: avatar,
            profile_url: profileUrl,
          },
          { onConflict: "id" },
        );

        // Generate a magiclink and use the action_link's hash so the SPA sets a session
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${origin}/auth/callback` },
        });
        if (linkErr || !linkData?.properties?.action_link) {
          console.error("generateLink failed", linkErr);
          return new Response(null, { status: 302, headers: { Location: `${origin}/?steam_error=link` } });
        }

        // Send the user to the action_link — Supabase will then redirect to /auth/callback
        // with #access_token=... in the hash.
        return new Response(null, {
          status: 302,
          headers: { Location: linkData.properties.action_link },
        });
      },
    },
  },
});
