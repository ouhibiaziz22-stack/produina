import { createFileRoute } from "@tanstack/react-router";
import { BacShop } from "@/features/bac-shop/BacShop";

export const Route = createFileRoute("/bac")({
  head: () => ({
    meta: [
      { title: "BAC 2K27 — AZIX Class of 2027 Capsule" },
      {
        name: "description",
        content:
          "Discover AZIX BAC 2K27 class hoodies and tees. Personalize your size, lycée, name, and section.",
      },
      { property: "og:title", content: "BAC 2K27 — AZIX Class of 2027 Capsule" },
      { property: "og:description", content: "Your class. Your moment. Your uniform." },
      { property: "og:image", content: "/assets/bac-campaign-4yqb7kLi.jpg" },
    ],
  }),
  component: BacShop,
});
