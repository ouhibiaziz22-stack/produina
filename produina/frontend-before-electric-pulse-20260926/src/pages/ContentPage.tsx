import { Link, useParams } from 'react-router-dom'

const content: Record<string, { title: string; text: string }> = {
  products: { title: 'Nos produits', text: 'Explore les pièces Produiwina et ouvre l’atelier pour créer la tienne.' },
  cart: { title: 'Ton panier', text: 'Retrouve ici les pièces que tu as ajoutées depuis l’atelier.' },
  checkout: { title: 'Finaliser la commande', text: 'Choisis ton mode de livraison et valide tes informations.' },
  profile: { title: 'Mon profil', text: 'Gère tes coordonnées et préférences.' },
  orders: { title: 'Mes commandes', text: 'Suis chaque étape de la production et de la livraison.' },
  designs: { title: 'Mes créations', text: 'Retrouve, modifie ou commande les designs sauvegardés.' },
  gallery: { title: 'Nos créations', text: 'Quelques idées créées par la communauté Produiwina.' },
  contact: { title: 'Contact', text: 'Une question sur ta commande ou ton design ? Notre équipe est là.' },
  faq: { title: 'Questions fréquentes', text: 'Tout ce qu’il faut savoir avant de créer ta pièce.' },
  about: { title: 'À propos de Produiwina', text: 'Une plateforme tunisienne pour rendre chaque souvenir de BAC unique.' },
}

export function ContentPage() {
  const { page = '' } = useParams()
  const item = content[page] ?? { title: 'Page introuvable', text: 'Cette page n’existe pas.' }
  return <main className="content-page"><span className="eyebrow">PRODUIWINA</span><h1>{item.title}</h1><p>{item.text}</p><Link className="primary-button" to="/">Retour à l’accueil</Link></main>
}
