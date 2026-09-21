import { useCallback, useState } from 'react'

export function useAsync<T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const execute = useCallback(async (operation: () => Promise<T>) => {
    setLoading(true); setError(null)
    try { return await operation() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Une erreur est survenue'); throw cause } finally { setLoading(false) }
  }, [])
  return { execute, loading, error }
}
