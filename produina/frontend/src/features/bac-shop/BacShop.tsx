import { Storefront } from "@/components/storefront";

export function BacShop() {
  if (import.meta.env["VITE_FEATURE_BAC"] === "false") {
    return (
      <main className="site-shell">
        <section className="page-intro">
          <span className="section-kicker">AZIX / COLLECTION</span>
          <h1>
            BAC 2K27 IS
            <br />
            <i>PAUSED.</i>
          </h1>
          <p>This collection is temporarily unavailable.</p>
        </section>
      </main>
    );
  }
  return <Storefront view="bac" />;
}
