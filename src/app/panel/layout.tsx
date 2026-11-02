import type { Metadata } from "next";
import { AppShell, RequireAuth } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";
import { PlayerProvider } from "@/components/workout-player";

export const metadata: Metadata = {
  title: { default: "Mi panel", template: "%s · Mi panel | DNI GYM" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth onboarding>
      <DataProvider>
        <PlayerProvider>
          <AppShell>{children}</AppShell>
        </PlayerProvider>
      </DataProvider>
    </RequireAuth>
  );
}
