export type StormProduct = {
  id: string
  name: string
  subtitle: string
  price: number
  colors: { name: string; value: string }[]
  image: string
  description: string
  badge?: string
  category: 'tops' | 'bottoms' | 'outerwear' | 'limited'
  preorder?: boolean
}

export const stormProducts: StormProduct[] = [
  {
    id: 'volt-hoodie',
    name: 'VOLT HOODIE',
    subtitle: '460 GSM / brushed storm fleece',
    price: 128,
    badge: 'NEW DROP',
    category: 'tops',
    image: 'https://raw.githubusercontent.com/ouhibiaziz22-stack/azix-electric-pulse/main/src/assets/hoodie.jpg',
    description: 'A heavyweight silhouette cut for late nights. Brushed fleece, dropped shoulders and a reflective AZIX storm mark.',
    colors: [{ name: 'Obsidian', value: '#101216' }, { name: 'Static Grey', value: '#747b85' }, { name: 'Electric', value: '#0b5cff' }],
  },
  {
    id: 'static-shell',
    name: 'STATIC SHELL',
    subtitle: 'water-resistant / technical nylon',
    price: 184,
    badge: 'LIMITED',
    category: 'outerwear',
    image: 'https://raw.githubusercontent.com/ouhibiaziz22-stack/azix-electric-pulse/main/src/assets/hoodie.jpg',
    description: 'A cropped technical shell with an articulated hood and a midnight nylon finish. Built to change with the weather.',
    colors: [{ name: 'Night', value: '#121417' }, { name: 'Cloud', value: '#d9dde0' }],
  },
  {
    id: 'arc-tee',
    name: 'ARC TEE',
    subtitle: '240 GSM / compact cotton',
    price: 74,
    category: 'tops',
    image: 'https://raw.githubusercontent.com/ouhibiaziz22-stack/azix-electric-pulse/main/src/assets/tee.jpg',
    description: 'A dense cotton jersey tee with a precise oversized cut and an electric-blue arc printed across the back.',
    colors: [{ name: 'Ink', value: '#18191b' }, { name: 'Bone', value: '#e8e5df' }, { name: 'Cobalt', value: '#124bd8' }],
  },
  {
    id: 'afterdark-pant',
    name: 'AFTERDARK PANT',
    subtitle: 'structured twill / relaxed leg',
    price: 142,
    category: 'bottoms',
    image: 'https://raw.githubusercontent.com/ouhibiaziz22-stack/azix-electric-pulse/main/src/assets/cargo.jpg',
    description: 'A relaxed technical trouser with a sharp tapered line, hidden pockets and a subtle reflective side seam.',
    colors: [{ name: 'Carbon', value: '#181a1e' }, { name: 'Storm Grey', value: '#6b7078' }],
  },
  {
    id: 'ion-cap',
    name: 'ION CAP',
    subtitle: 'six-panel / reflective embroidery',
    price: 58,
    category: 'limited',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1100&q=84',
    description: 'A structured six-panel cap with a low profile, concealed adjuster and a flash of reflective embroidery.',
    colors: [{ name: 'Obsidian', value: '#101216' }, { name: 'Electric', value: '#0b5cff' }],
  },
  {
    id: 'strike-knit',
    name: 'STRIKE KNIT',
    subtitle: 'rib knit / cropped weight',
    price: 112,
    category: 'tops',
    image: 'https://images.unsplash.com/photo-1624206112918-f140f087f9b5?auto=format&fit=crop&w=1100&q=84',
    description: 'A compact rib knit engineered with a close collar, dropped sleeve and a clean lightning-bolt stitch detail.',
    colors: [{ name: 'Graphite', value: '#25262a' }, { name: 'Ice', value: '#dadddf' }],
  },
]

export const bacProducts: StormProduct[] = [
  { id: 'bac-hoodie-2027', name: 'BAC 2K27 HOODIE', subtitle: 'custom class edition / 460 GSM', price: 75, badge: 'PRE-ORDER', preorder: true, category: 'limited', image: 'https://raw.githubusercontent.com/ouhibiaziz22-stack/azix-electric-pulse/main/src/assets/hoodie.jpg', description: 'The Class of 2027 heavyweight hoodie. Add your lycée, section and crew details through a custom order.', colors: [{ name: 'Noir', value: '#0b0c0e' }, { name: 'Navy', value: '#172647' }, { name: 'Bordeaux', value: '#651d2a' }] },
  { id: 'bac-tee-2027', name: 'BAC 2K27 TEE', subtitle: 'custom class edition / compact cotton', price: 40, badge: 'CUSTOM', preorder: true, category: 'tops', image: 'https://raw.githubusercontent.com/ouhibiaziz22-stack/azix-electric-pulse/main/src/assets/tee.jpg', description: 'A lightweight class tee for graduation season and custom group orders.', colors: [{ name: 'Noir', value: '#111216' }, { name: 'Royal Blue', value: '#2455cc' }, { name: 'White', value: '#f4f4f1' }] },
  { id: 'bac-lycee-hoodie', name: 'BAC 2K27 CLASS HOODIE', subtitle: 'lycée & class custom / heavyweight', price: 82, badge: 'CUSTOM', preorder: true, category: 'limited', image: 'https://raw.githubusercontent.com/ouhibiaziz22-stack/azix-electric-pulse/main/src/assets/bac-campaign.jpg', description: 'The custom heavyweight hoodie for your lycée, section and graduating class.', colors: [{ name: 'Charcoal', value: '#36393d' }, { name: 'Forest', value: '#164f3d' }, { name: 'Sand', value: '#cbb89c' }] },
]

export const getStormProduct = (id?: string) => [...stormProducts, ...bacProducts].find((product) => product.id === id) ?? stormProducts[0]
