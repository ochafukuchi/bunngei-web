// JavaScriptが動くことをCSSに伝え、表示前の要素を準備します。
document.documentElement.classList.add("js-enabled");

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

// 小さな画面では目次を開閉し、リンクを選ぶと自動で閉じます。
if (menuToggle && siteNav) {
  const menuMediaQuery = window.matchMedia("(max-width: 1050px)");

  const closeMenu = (restoreFocus = false) => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "目次を開く");
    siteNav.classList.remove("is-open");
    siteNav.inert = menuMediaQuery.matches;
    if (restoreFocus) {
      menuToggle.focus();
    }
  };

  const syncMenuForViewport = () => {
    if (menuMediaQuery.matches) {
      closeMenu();
    } else {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "目次を開く");
      siteNav.classList.remove("is-open");
      siteNav.inert = false;
    }
  };

  syncMenuForViewport();
  menuMediaQuery.addEventListener("change", syncMenuForViewport);

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "目次を開く" : "目次を閉じる");
    siteNav.classList.toggle("is-open", !isOpen);
    siteNav.inert = isOpen;
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (menuToggle.getAttribute("aria-expanded") === "true"
      && event.target instanceof Node
      && !siteNav.contains(event.target)
      && !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
    }
  });
}

// 対応ブラウザーでは、章が画面に入ったときに控えめに表示します。
const revealItems = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}