import type { BacProduct } from './types'

export const fallbackBacProducts: BacProduct[] = [
  { id: 'bac-hoodie-2027', name: 'Hoodie BAC 2027', type: 'hoodie', category: 'bac', description: 'Le hoodie souvenir de ta promotion.', basePrice: 75, colors: ['Noir', 'Bordeaux', 'Navy'], fabrics: [{ name: 'Coton', price: 0 }, { name: 'Heavyweight', price: 14 }], printPrices: [{ name: 'DTF', price: 5 }], sizes: ['S', 'M', 'L', 'XL', 'XXL'], images: [], active: true, slug: 'hoodie-bac-2027' },
  { id: 'bac-tee-2027', name: 'T-shirt BAC 2027', type: 'tshirt', category: 'bac', description: 'Un t-shirt léger à personnaliser pour toute la classe.', basePrice: 40, colors: ['Blanc cassé', 'Noir', 'Royal blue'], fabrics: [{ name: 'Coton', price: 0 }], printPrices: [{ name: 'DTF', price: 5 }], sizes: ['S', 'M', 'L', 'XL', 'XXL'], images: [], active: true, slug: 'tshirt-bac-2027' },
  { id: 'bac-lycee-hoodie', name: 'Hoodie Lycée & Classe', type: 'oversized', category: 'bac', description: 'Le merch de ton lycée, de ta section et de ta promotion.', basePrice: 82, colors: ['Charcoal', 'Forest', 'Sand'], fabrics: [{ name: 'Heavyweight', price: 14 }], printPrices: [{ name: 'DTF', price: 5 }], sizes: ['S', 'M', 'L', 'XL', 'XXL'], images: [], active: true, slug: 'hoodie-lycee-classe' },
]
