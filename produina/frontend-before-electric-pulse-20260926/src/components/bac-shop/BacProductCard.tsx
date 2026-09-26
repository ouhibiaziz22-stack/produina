import { Link } from 'react-router-dom'
import type { BacProduct } from './types'

export function BacProductCard({ product, onChoose }: { product: BacProduct; onChoose: (product: BacProduct) => void }) {
  return <article className="bac-product-card"><div className="bac-product-art"><span>BAC<br /><b>27</b></span><div className={`bac-garment bac-${product.type}`} /></div><div className="bac-product-info"><div><h3>{product.name}</h3><p>{product.description}</p></div><strong>{product.basePrice} DT</strong></div><div className="bac-product-actions"><button className="primary-button" onClick={() => onChoose(product)}>Personnaliser</button><Link className="text-button" to={`/bac/${product.slug || product.id}`}>Détails →</Link></div></article>
}
