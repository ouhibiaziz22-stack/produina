import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type CartItem = {
  id: string | number
  product: { id?: string; name: string; price?: number; basePrice?: number; kind?: string }
  category: 'main' | 'bac'
  total: number
  quantity: number
  color?: string
  colorName?: string
  fabric?: { name: string; price?: number }
  size: string
  customization?: { studentName: string; lycee: string; section: string }
}

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void
  updateQuantity: (id: CartItem['id'], amount: number) => void
  removeItem: (id: CartItem['id']) => void
  clear: () => void
}

const STORAGE_KEY = 'produiwina_cart'
const CartContext = createContext<CartContextValue | undefined>(undefined)

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart)
  const persist = (next: CartItem[]) => {
    setItems(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }
  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.total * item.quantity, 0),
    addItem: (item) => persist([...items, { ...item, id: `${Date.now()}-${Math.random()}`, quantity: 1 }]),
    updateQuantity: (id, amount) => persist(items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item)),
    removeItem: (id) => persist(items.filter((item) => item.id !== id)),
    clear: () => persist([]),
  }), [items])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
