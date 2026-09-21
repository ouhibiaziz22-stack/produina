export type UserRole = 'user' | 'admin'
export type ProductType = 'hoodie' | 'jacket' | 'tshirt' | 'polo' | 'oversized' | 'other'
export interface PriceOption { name: string; price: number }
export interface Product { id: string; name: string; type: ProductType; description: string; basePrice: number; colors: string[]; fabrics: PriceOption[]; printPrices: PriceOption[]; sizes: string[]; images: string[]; active: boolean }
export interface ApiResponse<T> { success: boolean; data: T; message?: string }
export interface AuthUser { id: string; name: string; email: string; phone?: string; role: UserRole; address?: string }
export interface AuthPayload { user: AuthUser; token: string }
export interface AiLogoConcept { id: string; label: string; prompt: string; mark: string; format: 'svg'; price: 0 }
export interface AiLogoRequest { bacSection: string; year: string; text: string; concept: string; style: string; colors: string[]; icons: string[]; description?: string }
