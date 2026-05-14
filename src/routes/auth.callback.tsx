import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    // Supabase JS auto-detects the session from the URL hash. Give it a tick.
    const t = setTimeout(async () => {
      await supabase.auth.getSession();
      navigate({ to: "/inventory" });
    }, 200);
    return () => clearTimeout(t);
  }, [navigate]);
  return (
    <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
      Signing you in with Steam…
    </div>
  );
}
