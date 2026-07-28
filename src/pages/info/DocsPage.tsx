import { Link } from "react-router-dom";
import { DocSection } from "../../components/docs/DocSection";
import "./DocsPage.scss";

export function DocsPage() {
  return (
    <article className="docs-page">
      <header className="docs-page__header">
        <h1>Whisk Documentation</h1>
        <p>Architecture, features, and converter specifications.</p>
      </header>

      <div className="docs-page__content">
        <DocSection title="Overview" defaultOpen>
          <p>
            Whisk is a free, ad-free PWA for recipes, shopping lists, file conversion, and image tools. Conversions
            and image processing run in the browser; account data syncs to Heroku when you sign in.
          </p>
          <p>
            See also: <Link to="/how-it-works">How it works</Link> · <Link to="/privacy">Privacy</Link> ·{" "}
            <Link to="/capabilities">Capabilities</Link>
          </p>
        </DocSection>

        <DocSection title="Architecture">
          <table>
            <thead>
              <tr>
                <th>Layer</th>
                <th>Stack</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Frontend (Netlify)</td>
                <td>React, TypeScript, SCSS, Zustand, Vite PWA, React Router</td>
              </tr>
              <tr>
                <td>Backend (Heroku)</td>
                <td>Node.js, Express, Prisma, Postgres, JWT auth</td>
              </tr>
              <tr>
                <td>Browser engines</td>
                <td>FFmpeg.wasm (self-hosted), pdf.js, canvas, fflate, Cheerio (URL import on server only)</td>
              </tr>
            </tbody>
          </table>
        </DocSection>

        <DocSection title="Data boundaries">
          <p><strong>Stays on your device:</strong> file conversions, image tools, unit converter calculations.</p>
          <p><strong>Stored on server when signed in:</strong> account, recipes, folders, tags, shopping list, theme and unit preferences.</p>
        </DocSection>

        <DocSection title="Features">
          <ul>
            <li><strong>File converter</strong>: Images, audio, video, documents, and data formats (see Capabilities)</li>
            <li><strong>Image tools</strong>: Crop, resize, compress, remove background, QR, markdown preview</li>
            <li><strong>Unit converter</strong>: Volume, weight, temperature, length</li>
            <li><strong>Recipes</strong>: CRUD, URL import, folders, tags, search</li>
            <li><strong>Shopping list</strong>: Syncs when signed in; local fallback when signed out</li>
            <li><strong>Settings</strong>: Theme and default unit category with server sync</li>
            <li><strong>Auth</strong>: Register, sign in, forgot/reset password</li>
          </ul>
        </DocSection>

        <DocSection title="Converter spec">
          <p><strong>Unit handler:</strong> Pure functions, canonical units (ml, grams, °C), convert/scale APIs.</p>
          <p><strong>File handler:</strong> FFmpeg.wasm for media; pure JS for JSON/CSV/XML/YAML/TOML, TXT/MD/HTML/RTF; pdf.js for PDF.</p>
          <p><strong>Headers:</strong> COOP: same-origin, COEP: require-corp for SharedArrayBuffer (Netlify + Vite dev server).</p>
        </DocSection>

        <DocSection title="Testing & CI">
          <p>Vitest covers frontend and backend logic. GitHub Actions runs tests on push/PR.</p>
          <p><code>npm test</code> (root) · <code>cd backend && npm test</code></p>
        </DocSection>

        <DocSection title="Accessibility">
          <ul>
            <li>Semantic HTML, landmarks, logical headings</li>
            <li>Full keyboard nav, visible focus, skip link</li>
            <li>ARIA labels, screen reader support</li>
            <li>4.5:1 contrast, prefers-reduced-motion respected</li>
          </ul>
        </DocSection>
      </div>
    </article>
  );
}
