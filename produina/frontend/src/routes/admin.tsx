import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — AZIX Store Control" },
      { name: "description", content: "Manage AZIX products, stock, shop visibility, and orders." },
    ],
  }),
  component: AdminDashboard,
});
