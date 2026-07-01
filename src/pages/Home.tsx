import { Link } from "react-router-dom";
import { IconFolder, IconFile, IconWrench } from "../components/ui/AnimatedIcon";
import { IconRecipe } from "../components/ui/SidebarIcons";
import "./Home.scss";

export function Home() {
  return (
    <article>
      <h1>Whisk</h1>
      <p className="home-intro">
        Your personal place for managing recipes for food, soaps, fragrances, cosmetics, and more!
      </p>
      <div className="home-cards">
        <Link to="/converter" className="home-card">
          <span className="home-card__icon" aria-hidden>
            <IconFolder />
          </span>
          <h2 className="home-card__title">Converter</h2>
          <p className="home-card__desc">Convert files or units. Drop a file, pick a format, done.</p>
        </Link>
        <Link to="/tools" className="home-card">
          <span className="home-card__icon" aria-hidden>
            <IconWrench />
          </span>
          <h2 className="home-card__title">Tools</h2>
          <p className="home-card__desc">Crop, resize, compress, remove backgrounds, generate QR codes, and more.</p>
        </Link>
        <Link to="/recipes" className="home-card">
          <span className="home-card__icon" aria-hidden>
            <IconRecipe />
          </span>
          <h2 className="home-card__title">Recipes</h2>
          <p className="home-card__desc">Save and manage your recipes. Sign in to sync across devices.</p>
        </Link>
        <Link to="/docs" className="home-card">
          <span className="home-card__icon" aria-hidden>
            <IconFile />
          </span>
          <h2 className="home-card__title">Docs</h2>
          <p className="home-card__desc">Full project requirements, architecture, and converter specs.</p>
        </Link>
      </div>
    </article>
  );
}
