"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState keeps one QueryClient stable across re-renders (a module-level
  // client would be shared across requests on the server).
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            // "always" bypasses staleTime for focus events — every tab-back
            // triggers a refetch immediately. The default ("true") only
            // refetches when the data is already stale, which means a quick
            // tab-away and back inside staleTime is silently a no-op.
            refetchOnWindowFocus: "always",
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
