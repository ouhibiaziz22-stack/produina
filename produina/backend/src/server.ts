import { app } from './app.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { ensureAdminAccount } from './services/adminBootstrap.js'

let connecting = false

async function connectServices() {
  if (connecting || app.locals.databaseReady) return
  connecting = true
  try {
    await connectDatabase()
    await ensureAdminAccount()
    app.locals.databaseReady = true
    console.info('Database services are ready.')
  } catch (error) {
    console.error('Supabase unavailable. Check SUPABASE_URL and SUPABASE_SECRET_KEY, then apply the database migrations.', error)
    const retry = setTimeout(() => { void connectServices() }, 15_000)
    retry.unref()
  } finally {
    connecting = false
  }
}

async function start() {
  app.listen(env.PORT, () => console.info(`Produiwina API listening on http://localhost:${env.PORT}`))
  void connectServices()
}

void start()
