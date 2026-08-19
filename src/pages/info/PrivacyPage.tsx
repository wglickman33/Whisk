import { Link } from "react-router-dom";
import "./PrivacyPage.scss";

export function PrivacyPage() {
  return (
    <article className="static-page privacy-page">
      <header className="static-page__header">
        <h1>Privacy</h1>
        <p>What stays on your device, what we store, and what we do not do.</p>
        <p className="static-page__tagline">Free · No ads · No tracking pixels</p>
      </header>

      <section className="static-page__callout" aria-label="Summary">
        <span className="static-page__badge">Your files stay local</span>
        <p>
          File conversions, image tools, and unit conversions run entirely in your browser. Whisk does not
          upload those files to our servers.
        </p>
      </section>

      <section className="static-page__section">
        <h2>What runs on your device</h2>
        <ul>
          <li>File format conversions (images, audio, video, documents, data files)</li>
          <li>Image tools: crop, resize, compress, background removal, QR codes, and more</li>
          <li>Unit converter calculations</li>
          <li>PWA caching for offline use</li>
        </ul>
      </section>

      <section className="static-page__section">
        <h2>What we store on the server</h2>
        <p>
          When you create an account, Whisk saves your account data on Heroku with a Postgres database so you
          can sign in from any device:
        </p>
        <ul>
          <li>Email address and hashed password</li>
          <li>Recipes, folders, tags, and ingredients</li>
          <li>Shopping list items, categories, and which list they belong to</li>
          <li>Shared lists: list membership, share codes, and who added each item (visible to list members)</li>
          <li>Preferences such as light, dark, or auto theme and default unit category</li>
        </ul>
        <p>
          Recipe URL import sends the URL (not your local files) to our API so we can fetch and parse the page.
        </p>
        <p>
          Recipe photo import sends one or more photos to Groq so it can read the ingredients and steps into a
          single recipe. Photos are not stored. Nothing is saved to your recipes until you review and tap Save.
          Sous AI chat also uses Groq.
        </p>
        <p>
          When you use a shared shopping list, Whisk opens a live connection (Server-Sent Events) to our API so
          changes from other members appear in real time. This is only used for list sync - not for analytics or
          advertising.
        </p>
      </section>

      <section className="static-page__section">
        <h2>What we do not do</h2>
        <ul>
          <li>No advertising or ad networks</li>
          <li>No analytics trackers or social widgets</li>
          <li>No selling or sharing your personal data</li>
          <li>No uploading conversion files to the cloud</li>
        </ul>
      </section>

      <section className="static-page__section">
        <h2>Local storage in your browser</h2>
        <ul>
          <li>Sign-in token (JWT) so you stay logged in</li>
          <li>Theme and settings before or between syncs (including when signed out)</li>
          <li>Shopping list cache and selected list when signed out</li>
        </ul>
      </section>

      <section className="static-page__section">
        <h2>Password reset emails</h2>
        <p>
          If email delivery is configured on the server, we send a one-time reset link to your address. We do
          not use your email for marketing.
        </p>
      </section>

      <section className="static-page__section">
        <h2>Questions</h2>
        <p>
          Whisk is a personal project. For account or data questions, contact the site owner through the email
          associated with your account registration.
        </p>
      </section>

      <footer className="static-page__footer">
        <Link to="/how-it-works">How it works</Link>
        <Link to="/capabilities">Capabilities</Link>
      </footer>
    </article>
  );
}
