import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { productService } from '../services/productService'
import type { Product } from '../types'

export function ProductDetailPage() {
  const { id = '' } = useParams(), [product, setProduct] = useState<Product | null>(null), [error, setError] = useState('')
  useEffect(() => { productService.get(id).then(setProduct).catch(() => setError('Produit indisponible.')) }, [id])
  if (error) return <main className="content-page"><h1>{error}</h1><Link to="/products" className="primary-button">Retour aux produits</Link></main>
  if (!product) return <main className="content-page"><span className="eyebrow">CHARGEMENT</span><h1>On prépare la pièce…</h1></main>
  return <main className="content-page"><span className="eyebrow">DÉTAIL PRODUIT</span><h1>{product.name}</h1><p>{product.description}</p><strong>{product.basePrice} DT</strong><p>{product.colors.length} couleurs · {product.sizes.join(' · ')}</p><Link to="/#personnaliser" className="primary-button">Personnaliser cette pièce</Link></main>
}
