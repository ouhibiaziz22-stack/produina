import type { Product } from '../../types'

export const BAC_SECTIONS = ['Math', 'Sciences', 'Technique', 'Info', 'Éco-Gestion', 'Lettres', 'Sport'] as const
export type BacSection = typeof BAC_SECTIONS[number]
export type BacCustomization = { studentName: string; lycee: string; section: BacSection }
export type BacProduct = Product & { category: 'bac'; slug?: string }
