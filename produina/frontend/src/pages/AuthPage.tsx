import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService, getAuthErrorMessage } from '../services/authService'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { authenticate } = useAuth(), navigate = useNavigate()
  const [error, setError] = useState(''), [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('')
    const values = new FormData(event.currentTarget)
    try {
      const payload = mode === 'login' ? await authService.login({ email: String(values.get('email')), password: String(values.get('password')) }) : await authService.register({ name: String(values.get('name')), email: String(values.get('email')), phone: String(values.get('phone') || ''), password: String(values.get('password')) })
      authenticate(payload); navigate('/')
    } catch (cause) { setError(getAuthErrorMessage(cause)) } finally { setLoading(false) }
  }
  return <main className="content-page auth-page"><Link className="auth-back" to="/">← Retour à l’accueil</Link><span className="eyebrow">COMPTE PRODUIWINA</span><h1>{mode === 'login' ? 'Bon retour.' : 'Crée ton compte.'}</h1><form onSubmit={submit}><>{mode === 'register' && <label>Nom complet<input name="name" autoComplete="name" required minLength={2}/></label>}</><label>Email<input name="email" type="email" autoComplete="email" required/></label>{mode === 'register' && <label>Téléphone<input name="phone" inputMode="tel" autoComplete="tel"/></label>}<label>Mot de passe<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8}/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="add-button" disabled={loading}>{loading ? 'Patiente…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button></form><p>{mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'} <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Inscription' : 'Connexion'}</Link></p></main>
}
