import "./NavBadge.scss";

interface NavBadgeProps {
  count: number;
  label?: string;
}

export function NavBadge({ count, label = "unread notifications" }: NavBadgeProps) {
  if (count <= 0) return null;
  const display = count > 99 ? "99+" : String(count);
  return (
    <span className="nav-badge" aria-label={`${count} ${label}`}>
      {display}
    </span>
  );
}
