interface DocSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function DocSection({ title, children, defaultOpen = false }: DocSectionProps) {
  return (
    <details className="doc-section" open={defaultOpen}>
      <summary className="doc-section__summary">{title}</summary>
      <div className="doc-section__content">{children}</div>
    </details>
  );
}
