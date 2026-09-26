import { createFileRoute } from "@tanstack/react-router";
import { BacShop } from "@/features/bac-shop/BacShop";

export const Route = createFileRoute("/bac-2k27")({
  head: () => ({
    meta: [
      { title: "BAC 2K27 — AZIX Class of 2027 Capsule" },
      {
        name: "description",
        content:
          "Meet the AZIX BAC 2K27 capsule for the Class of 2027. Explore the countdown, pre-order gear, or inquire about bulk class orders.",
      },
      { property: "og:title", content: "BAC 2K27 — AZIX Class of 2027 Capsule" },
      {
        property: "og:description",
        content: "Your class. Your moment. Your uniform. Discover the AZIX BAC 2K27 capsule.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BacShop,
});
