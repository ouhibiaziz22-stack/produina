import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/storefront";

export const Route = createFileRoute("/clothes")({
  head: () => ({
    meta: [
      { title: "Clothes — AZIX" },
      {
        name: "description",
        content:
          "Shop AZIX oversized hoodies, heavyweight cotton tees, and utility cargo pants. Find your fit and request a pre-order.",
      },
      { property: "og:title", content: "Clothes — AZIX" },
      {
        property: "og:description",
        content: "Oversized silhouettes, heavyweight feel. Shop the AZIX core collection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Storefront view="clothes" />,
});
