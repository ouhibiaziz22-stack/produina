import type { RequestHandler } from 'express'
import { aiLogoProvider } from '../services/aiLogoService.js'

export const generateLogo: RequestHandler = async (request, response) => {
  const concepts = await aiLogoProvider.generate(request.body)
  response.json({ success: true, data: { concepts, price: 0 } })
}
