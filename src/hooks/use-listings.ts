import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Listing = Tables<"listings">;

interface Options {
  limit?: number;
  statuses?: Array<Listing["status"]>;
}

export function useListings({ limit = 500, statuses = ["active", "unavailable", "sold"] }: Options = {}) {
  const qc = useQueryClient();
  const queryKey = ["listings", { limit, statuses }];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .in("status", statuses)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Listing[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`listings-feed-${limit}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        qc.invalidateQueries({ queryKey: ["listings"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc, limit]);

  return query;
}
