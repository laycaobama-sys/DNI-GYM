import type { Metadata } from "next";
import { AppShell, RequireAuth } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";

export const metadata: Metadata = {
  title: { default: "Mi panel", template: "%s · Mi panel | DNI GYM" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DataProvider>
        <AppShell>{children}</AppShell>
      </DataProvider>
    </RequireAuth>
  );
}
