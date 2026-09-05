import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Faz a rolagem suave até a seção indicada no hash da URL (ex.: /#sobre)
// e volta ao topo quando não há hash (ex.: ao clicar na logo / "Início").
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      let tries = 0;
      // A seção pode ainda não ter sido montada logo após a navegação,
      // então tentamos algumas vezes até encontrá-la.
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (tries < 12) {
          tries += 1;
          setTimeout(tryScroll, 60);
        }
      };
      tryScroll();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, hash]);

  return null;
}
