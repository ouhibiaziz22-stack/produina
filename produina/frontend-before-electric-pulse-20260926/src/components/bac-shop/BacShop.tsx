import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { productService } from '../../services/productService'
import { BacHero } from './BacHero'
import { BacProductGrid } from './BacProductGrid'
import { BacCustomizer } from './BacCustomizer'
import { fallbackBacProducts } from './bacProducts'
import type { BacProduct } from './types'
import './bacShop.css'

export function BacShop() {
  const [products, setProducts] = useState<BacProduct[]>(fallbackBacProducts)
  const [selected, setSelected] = useState<BacProduct | null>(null)
  const [error, setError] = useState('')
  const { items, count, total, updateQuantity, removeItem } = useCart()
  const bacItems = items.filter((item) => item.category === 'bac')
  useEffect(() => {
    if (import.meta.env.VITE_FEATURE_BAC === 'false') return
    productService.list('bac').then((data) => { if (data.length) setProducts(data as BacProduct[]) }).catch(() => setError('La collection locale est affichée.'))
  }, [])
  if (import.meta.env.VITE_FEATURE_BAC === 'false') return <main className="content-page"><h1>Cette collection est momentanément indisponible.</h1><Link className="primary-button" to="/">Retour à la boutique</Link></main>
  return <div className="bac-shop"><header className="bac-nav"><Link className="brand" to="/"><span>AZ</span>IX<i>.</i></Link><nav><Link to="/">Boutique principale</Link><a href="#bac-products" className="active">BAC 2027</a></nav><Link className="cart-button" to="#bac-cart">Panier {count > 0 && <b>{count}</b>}</Link></header><main><BacHero /><BacProductGrid products={products} onChoose={setSelected} />{error && <p className="bac-note">{error}</p>}<section className="bac-manifesto"><span className="eyebrow">MABROUK À TOUTE LA PROMO</span><h2>Un souvenir à porter,<br /><em>longtemps après les résultats.</em></h2><p>Nom, lycée, section : chaque détail raconte votre année.</p></section></main>{selected && <BacCustomizer product={selected} onClose={() => setSelected(null)} />}<aside className="bac-cart" id="bac-cart"><div><span className="eyebrow">PANIER PARTAGÉ</span><h2>{count} article{count !== 1 ? 's' : ''}</h2></div>{bacItems.map((item) => <div className="bac-cart-item" key={item.id}><div><strong>{item.product.name}</strong><small>{item.customization?.studentName} · {item.customization?.lycee} · {item.customization?.section}</small></div><div><button onClick={() => updateQuantity(item.id, -1)}>-</button><b>{item.quantity}</b><button onClick={() => updateQuantity(item.id, 1)}>+</button><button onClick={() => removeItem(item.id)}>×</button></div></div>)}<strong className="bac-cart-total">{total} DT</strong></aside></div>
}
