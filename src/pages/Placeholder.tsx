interface PlaceholderProps {
  title: string
}

export default function Placeholder({ title }: PlaceholderProps) {
  return (
    <section className="page">
      <h1 className="page-title">{title}</h1>
      <div className="empty-state">
        <p>Em breve.</p>
        <span>Esta seção ainda não possui funcionalidades.</span>
      </div>
    </section>
  )
}
