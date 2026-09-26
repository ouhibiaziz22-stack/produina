import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StormProductViewer } from '../components/StormProductViewer'
import { useCart } from '../context/CartContext'
import { getStormProduct } from '../data/catalog'

function Arrow() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg> }

export function ProductDetailPage() {
  const { id } = useParams()
  const product = getStormProduct(id)
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [color, setColor] = useState(product.colors[0])
  const [size, setSize] = useState('M')
  const [quantity, setQuantity] = useState(1)
  const [guideOpen, setGuideOpen] = useState(false)
  const addToBag = (checkout = false) => {
    for (let i = 0; i < quantity; i += 1) addItem({ product: { id: product.id, name: product.name, price: product.price, kind: 'streetwear' }, category: 'main', total: product.price, color: color.value, colorName: color.name, size })
    if (checkout) navigate('/')
  }
  return <div className="detail-page"><header className="detail-header"><Link className="azix-logo" to="/" aria-label="AZIX home">AZ<span>IX</span><i /></Link><Link className="back-link" to="/">← BACK TO SHOP</Link><button className="detail-cart" onClick={() => navigate('/')}>BAG <span>↗</span></button></header><main className="detail-layout"><section className="detail-info"><div className="detail-topline"><span>DROP 04 / {product.badge || 'CORE'}</span><span>01.26</span></div><h1>{product.name.split(' ').map((word, index) => <span key={`${word}-${index}`}>{word}</span>)}</h1><div className="detail-price">{product.price} DT</div><p className="detail-description">{product.description}</p><div className="detail-rule" /><div className="option-group"><div className="option-label"><span>COLOR</span><b>{color.name}</b></div><div className="color-options">{product.colors.map((option) => <button key={option.name} className={option.name === color.name ? 'selected' : ''} style={{ '--color-choice': option.value } as React.CSSProperties} onClick={() => setColor(option)} aria-label={option.name}><i /></button>)}</div></div><div className="option-group"><div className="option-label"><span>SIZE</span><button onClick={() => setGuideOpen(true)}>SIZE GUIDE ↗</button></div><div className="size-options">{['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((option) => <button key={option} onClick={() => setSize(option)} className={size === option ? 'selected' : ''}>{option}</button>)}</div></div><div className="detail-rule" /><div className="purchase-row"><div className="detail-quantity"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span>{String(quantity).padStart(2, '0')}</span><button onClick={() => setQuantity((value) => value + 1)}>+</button></div><button className="detail-add" onClick={() => addToBag()}>ADD TO BAG <Arrow /></button></div><button className="buy-now" onClick={() => addToBag(true)}>BUY NOW <Arrow /></button><div className="detail-details"><details open><summary>THE DETAILS <b>+</b></summary><p>Heavyweight construction, considered seams and a precision AZIX signature. Each piece is finished in limited runs.</p></details><details><summary>SHIPPING & RETURNS <b>+</b></summary><p>Ships in 2–4 business days. Returns accepted within 14 days of delivery.</p></details></div></section><StormProductViewer image={product.image} productName={product.name} /></main><button className="mobile-sticky-add" onClick={() => addToBag()}>ADD TO BAG <span>{product.price} DT</span></button>{guideOpen && <div className="guide-layer" onMouseDown={() => setGuideOpen(false)}><section onMouseDown={(event) => event.stopPropagation()}><button onClick={() => setGuideOpen(false)}>×</button><span>AZIX / FIT SYSTEM</span><h2>SIZE GUIDE</h2><p>Relaxed unisex fit. If you are between sizes, choose the larger size for a looser silhouette.</p><table><thead><tr><th>SIZE</th><th>CHEST</th><th>LENGTH</th></tr></thead><tbody>{[['XS', '56', '66'], ['S', '58', '68'], ['M', '61', '71'], ['L', '64', '74'], ['XL', '67', '77'], ['XXL', '70', '80']].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></section></div>}</div>
}
