import { useState } from 'react'
import { z } from 'zod'
import { useCart } from '../../context/CartContext'
import { BAC_SECTIONS, type BacCustomization, type BacProduct } from './types'

const bacCustomizationSchema = z.object({
  studentName: z.string().trim().min(2, 'Le nom est requis.'),
  lycee: z.string().trim().min(2, 'Le lycée est requis.'),
  section: z.enum(BAC_SECTIONS),
})

export function BacCustomizer({ product, onClose }: { product: BacProduct; onClose: () => void }) {
  const { addItem } = useCart()
  const [customization, setCustomization] = useState<BacCustomization>({ studentName: '', lycee: '', section: 'Math' })
  const [size, setSize] = useState(product.sizes[0] || 'M')
  const [color, setColor] = useState(product.colors[0] || '')
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = bacCustomizationSchema.safeParse(customization)
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Vérifie les informations de personnalisation.'); return }
    addItem({ product, category: 'bac', total: product.basePrice, size, color, colorName: color, customization: { studentName: parsed.data.studentName || '', lycee: parsed.data.lycee || '', section: parsed.data.section || 'Math' } })
    onClose()
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="bac-customizer" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={onClose}>×</button><span className="eyebrow">PERSONNALISATION BAC 2027</span><h2>{product.name}</h2><p>Ajoute les informations de ta promotion.</p><label>Nom de l’élève<input required minLength={2} value={customization.studentName} onChange={(event) => setCustomization({ ...customization, studentName: event.target.value })} placeholder="Ex. Aziz Ouhiba" /></label><label>Lycée<input required minLength={2} value={customization.lycee} onChange={(event) => setCustomization({ ...customization, lycee: event.target.value })} placeholder="Ex. Lycée Pilote de Tunis" /></label><label>Section<select value={customization.section} onChange={(event) => setCustomization({ ...customization, section: event.target.value as BacCustomization['section'] })}>{BAC_SECTIONS.map((section) => <option key={section}>{section}</option>)}</select></label><div className="bac-form-row"><label>Taille<select value={size} onChange={(event) => setSize(event.target.value)}>{product.sizes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Couleur<select value={color} onChange={(event) => setColor(event.target.value)}>{product.colors.map((item) => <option key={item}>{item}</option>)}</select></label></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="add-button" type="submit">Ajouter au panier · {product.basePrice} DT <span>→</span></button></form></div>
}
