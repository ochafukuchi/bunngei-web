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

const archiveCategories = {
  language: "品詞・語彙分析",
  function: "機能語の分析",
  content: "内容語の分析",
  mapping: "主成分分析・クラスター分析",
  ai: "AI生成作品との比較",
  other: "その他の研究資料"
};

const workCategories = {
  A: "事件・推理型",
  B: "怪奇・幻想型",
  C: "心理・不安型"
};

function requireCollection(name, value) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array.`);
  }
  return value;
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function isSafeLink(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }
  if (/^(https?:|mailto:)/i.test(value)) {
    return true;
  }
  return !/^[a-z][a-z\d+.-]*:/i.test(value) && !value.startsWith("//");
}

function appendLink(parent, href, label, className = "") {
  if (!isSafeLink(href)) {
    throw new TypeError(`Invalid link: ${href}`);
  }
  const link = createElement("a", className, label);
  link.href = href;
  if (/^https?:/i.test(href)) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  parent.append(link);
  return link;
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!parts) {
    throw new TypeError(`Invalid date: ${value}`);
  }
  const [, year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new TypeError(`Invalid date: ${value}`);
  }
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function createPublishedDate(value, className = "") {
  const time = createElement("time", className, formatDate(value));
  time.dateTime = value;
  return time;
}

function renderJournal() {
  const list = document.querySelector("#journal-list");
  if (!list) {
    return;
  }
  const entries = requireCollection("window.fieldNotes", window.fieldNotes);
  entries.forEach((entry) => {
    if (!entry.date || !entry.title || !entry.url) {
      throw new TypeError("Each field note requires a date, title, and URL.");
    }
    formatDate(entry.date);
  });
  entries
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((entry) => {
      const item = createElement("li", "journal-entry");
      const date = createPublishedDate(entry.date, "journal-entry__date");
      const content = createElement("div", "journal-entry__content");
      const title = createElement("h3", "journal-entry__title");
      appendLink(title, entry.url, entry.title);
      content.append(title);
      if (entry.summary) {
        content.append(createElement("p", "journal-entry__summary", entry.summary));
      }
      item.append(date, content);
      list.append(item);
    });
}

function renderArchiveCatalogue() {
  const catalogue = document.querySelector("#archive-catalogue");
  if (!catalogue) {
    return;
  }

  const entries = requireCollection("window.researchArchiveItems", window.researchArchiveItems);
  const total = document.querySelector("#archive-total");
  const emptyMessage = document.querySelector("#archive-empty");
  const filters = document.querySelector("#archive-filters");
  const buttons = [...filters.querySelectorAll("[data-filter]")];
  total.textContent = `${entries.length} 件`;

  const records = entries.map((entry) => {
    if (!entry.number || !entry.title || !entry.category) {
      throw new TypeError("Each research archive item requires a number, title, and category.");
    }
    if (!Object.hasOwn(archiveCategories, entry.category)) {
      throw new TypeError(`Unknown research archive category: ${entry.category}`);
    }
    const article = createElement("article", "archive-entry");
    article.dataset.category = entry.category;
    const metadata = createElement("div", "archive-entry__metadata");
    metadata.append(createElement("span", "archive-entry__number", `資料 ${entry.number}`));
    metadata.append(createElement("span", "archive-entry__category", archiveCategories[entry.category]));
    if (entry.publishedAt) {
      metadata.append(createPublishedDate(entry.publishedAt, "archive-entry__date"));
    }
    article.append(metadata);
    const body = createElement("div", "archive-entry__body");
    const title = createElement("h3", "archive-entry__title");
    if (entry.href) {
      appendLink(title, entry.href, entry.title);
    } else {
      title.textContent = entry.title;
    }
    body.append(title);
    if (entry.summary) {
      body.append(createElement("p", "archive-entry__summary", entry.summary));
    }
    article.append(body);
    if (entry.image) {
      const figure = createElement("figure", "archive-entry__figure");
      const image = createElement("img");
      image.src = entry.image;
      image.alt = entry.imageAlt || entry.title;
      image.loading = "lazy";
      figure.append(image);
      if (entry.imageCaption) {
        figure.append(createElement("figcaption", "", entry.imageCaption));
      }
      article.append(figure);
    }
    return article;
  });

  const updateFilter = (selectedCategory) => {
    let visibleCount = 0;
    records.forEach((record) => {
      const isVisible = selectedCategory === "all" || record.dataset.category === selectedCategory;
      record.hidden = !isVisible;
      if (isVisible) {
        visibleCount += 1;
      }
    });
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === selectedCategory));
    });
    emptyMessage.textContent = "該当する資料はありません。";
    emptyMessage.hidden = entries.length === 0 || visibleCount > 0;
  };

  records.forEach((record) => catalogue.append(record));
  filters.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    const button = event.target.closest("[data-filter]");
    if (button) {
      updateFilter(button.dataset.filter);
    }
  });
  updateFilter("all");
}

function renderWorkCatalogue() {
  const catalogue = document.querySelector("#work-catalogue");
  if (!catalogue) {
    return;
  }
  const works = requireCollection("window.generatedWorks", window.generatedWorks);
  const counts = { A: 0, B: 0, C: 0 };

  works.forEach((work) => {
    if (!work.id || !work.title || !work.category) {
      throw new TypeError("Each generated work requires an ID, title, and category.");
    }
    if (!Object.hasOwn(workCategories, work.category)) {
      throw new TypeError(`Unknown work category: ${work.category}`);
    }
    if (work.publishedAt) {
      formatDate(work.publishedAt);
    }
  });

  works
    .slice()
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .forEach((work) => {
      counts[work.category] += 1;
      const list = catalogue.querySelector(`[data-work-list="${work.category}"]`);
      const entry = createElement("article", "work-entry");
      const heading = createElement("h3", "work-entry__title");
      if (typeof work.body !== "string" || work.body.trim() === "") {
        heading.textContent = work.title;
      } else {
        appendLink(heading, `reading.html?id=${encodeURIComponent(work.id)}`, work.title);
      }
      entry.append(heading);
      if (work.summary) {
        entry.append(createElement("p", "work-entry__summary", work.summary));
      }

      const details = createElement("dl", "work-entry__details");
      if (work.characterCount || work.body) {
        const count = work.characterCount || Array.from(work.body.replace(/\s/g, "")).length;
        const countRow = createElement("div");
        countRow.append(createElement("dt", "", "文字数"));
        countRow.append(createElement("dd", "", `${count.toLocaleString("ja-JP")}字`));
        details.append(countRow);
      }
      if (work.publishedAt) {
        const dateRow = createElement("div");
        dateRow.append(createElement("dt", "", "公開日"));
        const dateValue = createElement("dd");
        dateValue.append(createPublishedDate(work.publishedAt));
        dateRow.append(dateValue);
        details.append(dateRow);
      }
      if (work.generationCondition) {
        const conditionRow = createElement("div");
        conditionRow.append(createElement("dt", "", "生成条件"));
        conditionRow.append(createElement("dd", "", work.generationCondition));
        details.append(conditionRow);
      }
      if (details.childElementCount > 0) {
        entry.append(details);
      }
      list.append(entry);
    });

  Object.entries(counts).forEach(([category, count]) => {
    catalogue.querySelector(`[data-work-count="${category}"]`).textContent = `${count} 篇`;
  });
}

function renderWorkReadingPage() {
  const article = document.querySelector("#work-reading");
  if (!article) {
    return;
  }
  const works = requireCollection("window.generatedWorks", window.generatedWorks);
  const workId = new URLSearchParams(window.location.search).get("id");
  const work = works.find((entry) => entry.id === workId);
  if (!work || typeof work.body !== "string" || work.body.trim() === "") {
    article.replaceChildren(createElement("p", "reading-message", "指定された作品の本文は公開されていません。"));
    return;
  }
  if (!Object.hasOwn(workCategories, work.category)) {
    throw new TypeError(`Unknown work category: ${work.category}`);
  }

  document.title = `${work.title} — AI作品展示室 — 文学鑑定事件簿`;
  article.replaceChildren();
  const header = createElement("header", "reading-article__header");
  header.append(createElement("p", "interior-heading__eyebrow", `${work.category} / ${workCategories[work.category]}`));
  header.append(createElement("h1", "reading-article__title", work.title));
  if (work.publishedAt) {
    header.append(createPublishedDate(work.publishedAt, "reading-article__date"));
  }
  if (work.generationCondition) {
    header.append(createElement("p", "reading-article__condition", `生成条件：${work.generationCondition}`));
  }
  article.append(header);

  const body = createElement("div", "reading-article__body");
  work.body.split(/\n\s*\n/).forEach((paragraph) => {
    if (paragraph.trim()) {
      body.append(createElement("p", "", paragraph.trim()));
    }
  });
  article.append(body);
}

renderJournal();
renderArchiveCatalogue();
renderWorkCatalogue();
renderWorkReadingPage();

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