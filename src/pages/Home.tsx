import { Link } from "react-router-dom";
import { IconFolder, IconFile, IconWrench } from "../components/ui/AnimatedIcon";
import { IconRecipe, IconShoppingList, IconSous } from "../components/ui/SidebarIcons";
import { useAuthStore } from "../store/authStore";
import { useShoppingActivityStore } from "../store/shoppingActivityStore";
import { SHOPPING_LIST_PATH } from "../utils/shoppingListShare";
import "./Home.scss";

function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Home() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const activities = useShoppingActivityStore((s) => s.activities);
  const unreadCount = useShoppingActivityStore((s) => s.unreadCount);
  const markAllRead = useShoppingActivityStore((s) => s.markAllRead);

  const recentActivities = activities.slice(0, 8);

  return (
    <article>
      <h1>Whisk</h1>
      <p className="home-intro">
        Your personal place for managing recipes for food, soaps, fragrances, cosmetics, and more!
      </p>

      {isSignedIn && recentActivities.length > 0 && (
        <section className="home-activity" aria-labelledby="home-activity-title">
          <div className="home-activity__header">
            <div>
              <h2 id="home-activity-title" className="home-activity__title">
                Shopping list activity
                {unreadCount > 0 && (
                  <span className="home-activity__count">{unreadCount}</span>
                )}
              </h2>
              <p className="home-activity__subtitle">
                Updates from lists you share with others.
              </p>
            </div>
            <div className="home-activity__actions">
              {unreadCount > 0 && (
                <button type="button" className="home-activity__mark-read" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
              <Link to={SHOPPING_LIST_PATH} className="home-activity__link">
                Open lists
              </Link>
            </div>
          </div>
          <ul className="home-activity__list">
            {recentActivities.map((activity) => (
              <li
                key={activity.id}
                className={`home-activity__item ${activity.read ? "" : "home-activity__item--unread"}`}
              >
                <p className="home-activity__item-text">
                  <strong>{activity.itemName}</strong> added to{" "}
                  <Link to={SHOPPING_LIST_PATH}>{activity.listName}</Link> by {activity.addedByName}
                </p>
                <time className="home-activity__item-time" dateTime={activity.createdAt}>
                  {formatActivityTime(activity.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}

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
          <p className="home-card__desc">Save, import, and export recipes. Sign in to sync across devices.</p>
        </Link>
        <Link to="/sous" className="home-card">
          <span className="home-card__icon" aria-hidden>
            <IconSous />
          </span>
          <h2 className="home-card__title">Sous</h2>
          <p className="home-card__desc">Ask about recipes, substitutions, or your shopping list.</p>
        </Link>
        <Link to={SHOPPING_LIST_PATH} className="home-card">
          <span className="home-card__icon" aria-hidden>
            <IconShoppingList />
          </span>
          <h2 className="home-card__title">Shopping list</h2>
          <p className="home-card__desc">
            Shared grocery lists with categories, share codes, and activity updates.
          </p>
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
