import { useEffect } from "react";

const BASE_TITLE = "DiscretaStore";
const SITE_URL = "https://discretasex.cl";

function setOrUpdateMeta(name: string, content: string, property = false) {
  const selector = property
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;
  let meta = document.querySelector<HTMLMetaElement>(selector);
  if (meta) {
    meta.setAttribute("content", content);
  } else {
    meta = document.createElement("meta");
    meta.setAttribute(property ? "property" : "name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
}

export function usePageMeta(title?: string, description?: string, image?: string) {
  useEffect(() => {
    const pageTitle = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE;
    const pageDesc = description || "Descubre una curaduría de objetos de deseo diseñados para explorar tu sensualidad. Envío discreto a todo Chile.";
    const pageImage = image || "https://discretasex.cl/icons.svg";
    const pageUrl = `${SITE_URL}${window.location.pathname}`;

    // Title
    document.title = pageTitle;

    // Basic meta
    setOrUpdateMeta("title", pageTitle);
    setOrUpdateMeta("description", pageDesc);
    setOrUpdateMeta("robots", "index, follow");

    // Canonical
    let canonical = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", pageUrl);

    // Open Graph
    setOrUpdateMeta("og:title", pageTitle, true);
    setOrUpdateMeta("og:description", pageDesc, true);
    setOrUpdateMeta("og:url", pageUrl, true);
    setOrUpdateMeta("og:image", pageImage, true);
    setOrUpdateMeta("og:type", "website", true);
    setOrUpdateMeta("og:site_name", BASE_TITLE, true);
    setOrUpdateMeta("og:locale", "es_CL", true);

    // Twitter Cards
    setOrUpdateMeta("twitter:card", "summary_large_image");
    setOrUpdateMeta("twitter:title", pageTitle);
    setOrUpdateMeta("twitter:description", pageDesc);
    setOrUpdateMeta("twitter:image", pageImage);
    setOrUpdateMeta("twitter:url", pageUrl);

  }, [title, description, image]);
}
