import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/storefront";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AZIX — Wear the Voltage" },
      {
        name: "description",
        content:
          "AZIX streetwear. Oversized hoodies, heavyweight tees, cargo pants, and the BAC 2K27 Class of 2027 capsule.",
      },
      { property: "og:title", content: "AZIX — Wear the Voltage" },
      {
        property: "og:description",
        content: "Built different. Worn louder. Explore AZIX streetwear and the BAC 2K27 capsule.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Storefront view="home" />;
}
