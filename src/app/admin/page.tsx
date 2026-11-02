import type { Metadata } from "next";
import { RequireAuth } from "@/components/app-shell";
import { AdminDashboard } from "./admin-dashboard";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <RequireAuth admin>
      <AdminDashboard />
    </RequireAuth>
  );
}
