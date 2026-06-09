interface LogoProps {
  /** Altura do wordmark em px (define a escala de tudo). */
  size?: number
  className?: string
}

/**
 * Logo "3DLookStore" reproduzido em SVG/texto:
 * - "3D" em peso forte + "LookStore" em peso regular
 * - swoosh decorativo abaixo do wordmark
 * Usa currentColor, então herda a cor do contexto (branco no tema escuro).
 */
export default function Logo({ size = 28, className }: LogoProps) {
  return (
    <span
      className={className ? `logo ${className}` : 'logo'}
      style={{ fontSize: size }}
      role="img"
      aria-label="3DLookStore"
    >
      <span className="logo-word">
        <span className="logo-word-bold">3D</span>LookStore
      </span>
      <svg
        className="logo-swoosh"
        viewBox="0 0 300 60"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path
          d="M6 40 C 70 60, 180 58, 252 34 C 285 24, 300 8, 286 4 C 300 18, 270 34, 214 40"
          strokeWidth="6"
        />
      </svg>
    </span>
  )
}
