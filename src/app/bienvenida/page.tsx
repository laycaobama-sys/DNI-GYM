import type { Metadata } from "next";
import { RequireAuth } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";
import { Onboarding } from "./onboarding";

export const metadata: Metadata = {
  title: "Crea tu plan",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return (
    <RequireAuth>
      <DataProvider>
        <Onboarding />
      </DataProvider>
    </RequireAuth>
  );
}
