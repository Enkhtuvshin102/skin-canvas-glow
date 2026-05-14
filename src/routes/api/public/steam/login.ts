import { createFileRoute, redirect } from "@tanstack/react-router";
import { buildOpenIdRedirect } from "@/lib/steam.server";

export const Route = createFileRoute("/api/public/steam/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const returnTo = `${origin}/api/public/steam/callback`;
        const realm = origin;
        const redirectUrl = buildOpenIdRedirect(returnTo, realm);
        return new Response(null, {
          status: 302,
          headers: { Location: redirectUrl },
        });
      },
    },
  },
});
