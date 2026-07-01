import { useMenu } from "../../context/menuContextShared";
import { IconHamburger } from "../ui/IconHamburger";
import "./MobileHeader.scss";

export function MobileHeader() {
  const { isMobileMenuOpen, toggleMobileMenu } = useMenu();

  return (
    <header className="mobile-header" role="banner">
      <button
        type="button"
        className="mobile-header__menu-btn hamburger-button"
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileMenuOpen}
      >
        <IconHamburger open={isMobileMenuOpen} />
      </button>
    </header>
  );
}
