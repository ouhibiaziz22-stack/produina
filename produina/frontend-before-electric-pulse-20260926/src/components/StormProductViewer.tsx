import { useState } from 'react'

type ViewerProps = { image: string; productName: string }

/**
 * The catalog currently has no uploaded GLB/GLTF models. This intentionally
 * renders the product photography fallback instead of simulating 3D. A real
 * model can replace this boundary later without changing the product page.
 */
export function StormProductViewer({ image, productName }: ViewerProps) {
  const [zoom, setZoom] = useState(1)
  return <section className="product-studio static-product-studio"><div className="studio-glow" /><div className="studio-top"><span>AZIX DIGITAL SAMPLE / 01</span><span>STUDIO IMAGE</span></div><div className="viewer-canvas static-viewer" onWheel={(event) => { event.preventDefault(); setZoom((value) => Math.max(1, Math.min(1.3, value - event.deltaY * .001))) }}><div className="studio-grid" /><figure className="studio-product-image" style={{ transform: `scale(${zoom})` }}><img src={image} alt={productName} fetchPriority="high" /><figcaption>PRODUCT IMAGE / NO 3D ASSET AVAILABLE</figcaption></figure></div><div className="studio-controls"><button onClick={() => setZoom((value) => Math.min(1.3, value + .1))} aria-label="Zoom in">+</button><button onClick={() => setZoom((value) => Math.max(1, value - .1))} aria-label="Zoom out">−</button><button className="reset-view" onClick={() => setZoom(1)}>RESET</button><span>LIGHT / 03</span></div></section>
}
