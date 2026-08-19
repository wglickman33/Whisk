import { Link } from "react-router-dom";
import "./HowItWorksPage.scss";

export function HowItWorksPage() {
  return (
    <article className="static-page how-it-works-page">
      <header className="static-page__header">
        <h1>How It Works</h1>
        <p>Browser-local tools plus cloud sync for the things you want to keep.</p>
      </header>

      <section className="static-page__callout" aria-label="Architecture summary">
        <span className="static-page__badge">Two layers</span>
        <p>
          Heavy lifting happens in your browser. Account-backed features sync through a small API on Heroku.
        </p>
      </section>

      <section className="static-page__section">
        <h2>Where things run</h2>
        <div className="static-page__table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Where it runs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>File converter</td>
                <td>Your browser (FFmpeg.wasm, pdf.js, canvas, etc.)</td>
              </tr>
              <tr>
                <td>Image tools</td>
                <td>Your browser</td>
              </tr>
              <tr>
                <td>Unit converter</td>
                <td>Your browser</td>
              </tr>
              <tr>
                <td>Recipes &amp; shopping list</td>
                <td>Heroku API + Postgres (when signed in)</td>
              </tr>
              <tr>
                <td>Settings sync</td>
                <td>Heroku API + Postgres (when signed in)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="static-page__section">
        <h2>File conversions</h2>
        <ol>
          <li>You drop a file in the converter.</li>
          <li>Whisk picks the right handler (image, audio, video, document, or data).</li>
          <li>Conversion runs locally: including self-hosted FFmpeg for media.</li>
          <li>You download the result. Nothing is sent to Whisk servers.</li>
        </ol>
        <p>
          See the full format list on the{" "}
          <Link to="/capabilities">capabilities page</Link>.
        </p>
      </section>

      <section className="static-page__section">
        <h2>Account &amp; sync</h2>
        <ol>
          <li>Register or sign in from the sidebar.</li>
          <li>Your session token is stored in the browser.</li>
          <li>Recipes, shopping lists, and settings load from the API.</li>
          <li>Changes save back to Postgres on Heroku.</li>
        </ol>
        <p>
          Sign out anytime. Local-only shopping list data can migrate to your account on first login if the
          server list is empty.
        </p>
        <p>
          <strong>Settings</strong> (theme and default unit category) work locally when signed out and sync to
          your account when signed in. Theme supports light, dark, or auto (follows your device&apos;s system
          appearance).
        </p>
      </section>

      <section className="static-page__section">
        <h2>Shopping lists</h2>
        <ol>
          <li>Create multiple lists, rename them, and switch between them from the list header.</li>
          <li>Share a list via link or code so other Whisk users can join.</li>
          <li>Add items manually, from recipes, or with aisle categories inferred from ingredient names.</li>
          <li>When adding recipe ingredients, Whisk can skip duplicates or add only missing items.</li>
          <li>Tap an item to check it off; use the pencil icon to edit.</li>
          <li>While a shared list is open, changes from other members update in real time over a live API connection.</li>
        </ol>
      </section>

      <section className="static-page__section">
        <h2>Recipes</h2>
        <ol>
          <li>Save recipes with folders, tags, and scaled servings.</li>
          <li>
            Import from a URL, a Whisk JSON export, or up to five photos of a long recipe, in page order.
          </li>
          <li>Export as Whisk JSON (full round-trip), PDF, or plain text.</li>
          <li>Send ingredients to your shopping list with optional deduplication.</li>
        </ol>
      </section>

      <section className="static-page__section">
        <h2>Deployment</h2>
        <ul>
          <li>
            <strong>Frontend:</strong> Netlify serves the PWA static build with COOP/COEP headers for
            SharedArrayBuffer (required by FFmpeg.wasm).
          </li>
          <li>
            <strong>Backend:</strong> Heroku runs the Express API and Postgres database.
          </li>
        </ul>
      </section>

      <section className="static-page__section">
        <h2>Offline use</h2>
        <p>
          Whisk installs as a PWA. Cached assets and converters can work offline after you have loaded the app
          once. Signed-in data needs a network connection to sync.
        </p>
      </section>

      <footer className="static-page__footer">
        <Link to="/privacy">Privacy</Link>
        <Link to="/docs">Documentation</Link>
      </footer>
    </article>
  );
}
