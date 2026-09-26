<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The storefront shares its catalog, cart, and request form in `src/components/storefront.tsx` across three leaf routes so shopping behavior stays consistent.
- Pre-orders and bulk inquiries are submitted to the private `preorder_requests` table; the browser cart is only a temporary selection, not an order record.
