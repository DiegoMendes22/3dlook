import logoUrl from '../assets/logo.svg'

interface LogoProps {
  /** Altura do logo em px. */
  size?: number
  className?: string
}

/**
 * Logo oficial "3DLookStore" (arquivo SVG, fundo transparente).
 * O wordmark é branco, então se destaca no tema escuro.
 */
export default function Logo({ size = 28, className }: LogoProps) {
  return (
    <img
      src={logoUrl}
      alt="3DLookStore"
      height={size}
      className={className ? `logo ${className}` : 'logo'}
      style={{ height: size, width: 'auto' }}
    />
  )
}
