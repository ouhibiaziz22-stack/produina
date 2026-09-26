import rateLimit from 'express-rate-limit'

const message = (text: string) => ({ success: false, message: text })

// Failed logins/registrations only; successful sign-ins do not use up the budget.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true, standardHeaders: 'draft-8', legacyHeaders: false,
  message: message('Too many attempts. Please wait 15 minutes and try again.'),
})

export const preorderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  message: message('Too many requests from this network. Please try again later.'),
})
