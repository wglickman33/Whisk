import { DocSection } from "../components/docs/DocSection";
import "./DocsPage.scss";

export function DocsPage() {
  return (
    <article className="docs-page">
      <header className="docs-page__header">
        <h1>Whisk Documentation</h1>
        <p>Project requirements, architecture, and converter specifications.</p>
      </header>

      <div className="docs-page__content">
        <DocSection title="Overview" defaultOpen>
          <p>
            RecipeApp (Whisk) is a personal PWA for managing recipes — food, soaps, fragrances, cosmetics.
            Built for personal and family use with no social features. Includes unit + file converter, recipe
            scaling, and AI ingredient substitution.
          </p>
        </DocSection>

        <DocSection title="Core Principles">
          <ul>
            <li>Personal/family use only — no social or sharing</li>
            <li>Offline via PWA service worker</li>
            <li>Data-driven logic throughout</li>
            <li>Fully accessible (WCAG 2.2 AA)</li>
            <li>Responsive 300px–2000px+</li>
            <li>US/Metric toggle + dark/light mode</li>
            <li>Clean, warm, functional design</li>
          </ul>
        </DocSection>

        <DocSection title="Tech Stack">
          <p><strong>Frontend:</strong> React, TypeScript, SCSS, Zustand, Vite PWA, React Router, Radix UI</p>
          <p><strong>Backend:</strong> Node.js, Express, SQLite (Prisma), Cheerio scraper, Gemini API</p>
          <p><strong>Deploy:</strong> Vercel/Netlify (frontend), Railway/Render (backend)</p>
        </DocSection>

        <DocSection title="Features">
          <ul>
            <li><strong>Recipe CRUD</strong> — Create, edit, import from URL, folders, tags</li>
            <li><strong>Converter</strong> — Unit conversion (volume, weight, temp, length) + file conversion (images, audio, video, data formats)</li>
            <li><strong>Scaling</strong> — Adjust servings and ingredient quantities</li>
            <li><strong>Substitutions</strong> — DB + AI assistant for ingredient replacements</li>
            <li><strong>Cook mode</strong> — Large-text, distraction-free view with timers</li>
            <li><strong>Settings</strong> — Unit system, theme, export/import data</li>
          </ul>
        </DocSection>

        <DocSection title="Accessibility">
          <ul>
            <li>Semantic HTML, landmarks, logical headings</li>
            <li>Full keyboard nav, visible focus, skip link</li>
            <li>ARIA labels, screen reader support</li>
            <li>4.5:1 contrast, 200% zoom support</li>
            <li>prefers-reduced-motion respected</li>
          </ul>
        </DocSection>

        <DocSection title="Converter Spec">
          <p><strong>Unit handler:</strong> Pure functions, canonical units (ml, grams, °C), convert/scale APIs.</p>
          <p><strong>File handler:</strong> FFmpeg.wasm for media; pure JS for JSON/CSV/XML/YAML/TOML, TXT/MD/HTML/RTF.</p>
          <p><strong>Headers:</strong> COOP: same-origin, COEP: require-corp for SharedArrayBuffer.</p>
        </DocSection>

        <DocSection title="Implementation Phases">
          <ol>
            <li>Foundation — scaffold, Prisma, theme, sidebar</li>
            <li>Recipe core — list, form, detail, search/filter</li>
            <li>Converter — unit + file, scaling tool</li>
            <li>Power — URL importer, cook mode, timers, substitution DB + AI</li>
            <li>Polish — accessibility audit, PWA testing, RTL</li>
          </ol>
        </DocSection>
      </div>
    </article>
  );
}
