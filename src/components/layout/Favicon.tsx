import { useEffect } from "react";
import { whiskLogoAmber } from "../../assets/logos";

export function Favicon() {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      document.head.appendChild(link);
    }
    link.href = whiskLogoAmber;
  }, []);
  return null;
}
