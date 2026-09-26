import { Link } from 'react-router-dom'

export function BacHero() {
  return <section className="bac-hero"><div><span className="eyebrow">COLLECTION BAC 2027</span><h1>Mabrouk.<br /><em>Ton souvenir commence ici.</em></h1><p>Des pièces pensées pour ta classe, ton lycée et ta promotion. Personnalise-les en quelques clics.</p><Link className="primary-button" to="#bac-products">Découvrir la collection <span>→</span></Link></div><div className="bac-hero-mark">27<span>✦</span></div></section>
}
