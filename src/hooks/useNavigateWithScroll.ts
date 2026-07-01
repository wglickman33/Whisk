import { useNavigate } from "react-router-dom";

/**
 * Returns a navigate function that scrolls to top on every navigation.
 */
export function useNavigateWithScroll() {
  const navigate = useNavigate();

  const navigateWithScroll = (
    to: string | number,
    options?: { replace?: boolean; state?: unknown }
  ) => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();
    navigate(to as string, options);
    setTimeout(scrollToTop, 10);
    setTimeout(scrollToTop, 100);
  };

  return navigateWithScroll;
}
