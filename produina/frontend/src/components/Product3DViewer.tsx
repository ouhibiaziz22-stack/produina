import type { ReactNode } from 'react'

export interface Product3DViewerProps {
  model?: string
  materials?: Record<string, unknown>
  colorZones?: string[]
  logos?: unknown[]
  texts?: unknown[]
  cameraSettings?: Record<string, unknown>
  fallback: ReactNode
}

/**
 * Model-ready viewer boundary. GLB/GLTF loading can be added here with
 * @react-three/fiber and drei when an admin uploads a model. Until then the
 * layered garment fallback keeps the customizer usable and fast.
 */
export function Product3DViewer({ model, fallback }: Product3DViewerProps) {
  return <div className={`product-3d-viewer ${model ? 'has-model' : 'fallback-viewer'}`} data-model={model || undefined}>{fallback}</div>
}
