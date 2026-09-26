import type { BacProduct } from './types'
import { BacProductCard } from './BacProductCard'

export function BacProductGrid({ products, onChoose }: { products: BacProduct[]; onChoose: (product: BacProduct) => void }) {
  return <section className="bac-products" id="bac-products"><div className="section-heading"><span className="eyebrow">POUR TA PROMO</span><h2>Les pièces <em>du souvenir.</em></h2><p>Choisis une base, puis ajoute les détails qui rendent ta pièce unique.</p></div><div className="bac-product-grid">{products.map((product) => <BacProductCard key={product.id} product={product} onChoose={onChoose} />)}</div></section>
}
