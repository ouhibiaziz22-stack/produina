export interface AiLogoRequest { bacSection: string; year: string; text: string; concept: string; style: string; colors: string[]; icons: string[]; description?: string }
export interface AiLogoConcept { id: string; label: string; prompt: string; mark: string; format: 'svg'; price: 0 }
export interface AiLogoProvider { generate(request: AiLogoRequest): Promise<AiLogoConcept[]> }

class PlaceholderAiLogoProvider implements AiLogoProvider {
  async generate(request: AiLogoRequest): Promise<AiLogoConcept[]> {
    const prompt = [request.bacSection, request.year, request.text, request.concept, request.style, request.colors.join(' ')].filter(Boolean).join(' · ')
    return ['⌘', '✦', request.year.slice(-2) || 'PW'].map((mark, index) => ({ id: `concept-${index + 1}`, label: `Concept ${String(index + 1).padStart(2, '0')}`, prompt, mark, format: 'svg' as const, price: 0 as const }))
  }
}

// Replace this provider with a self-hosted/open-source image model without changing controllers or routes.
export const aiLogoProvider: AiLogoProvider = new PlaceholderAiLogoProvider()
