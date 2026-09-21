"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ToolItem = {
  name: string;
  slug: string;
  icon: "compress" | "merge" | "split" | "crop" | "organize" | "rotate" | "delete" | "extract" | "images" | "numbers" | "word" | "powerpoint" | "excel" | "text" | "lock" | "shield" | "image";
};

type Group = {
  title: string;
  tools: ToolItem[];
};

const PDF_GROUPS: Group[] = [
  {
    title: "OPTIMIZE PDF",
    tools: [
      { name: "Compress PDF", slug: "compress-pdf", icon: "compress" },
    ],
  },
  {
    title: "MERGE & SPLIT",
    tools: [
      { name: "Merge PDF", slug: "merge-pdf", icon: "merge" },
      { name: "Merge PDF and Image", slug: "merge-pdf-and-image", icon: "merge" },
      { name: "Split PDF", slug: "split-pdf", icon: "split" },
    ],
  },
  {
    title: "VIEW & EDIT",
    tools: [
      { name: "Crop PDF Page", slug: "crop-pdf-page", icon: "crop" },
      { name: "Organize PDF", slug: "organize-pdf", icon: "organize" },
      { name: "Rotate PDF", slug: "rotate-pdf", icon: "rotate" },
      { name: "Remove PDF Pages", slug: "remove-pdf-pages", icon: "delete" },
      { name: "Extract PDF Pages", slug: "extract-pdf-pages", icon: "extract" },
      { name: "Extract PDF Images", slug: "extract-pdf-images", icon: "images" },
      { name: "Add Page Number", slug: "add-page-number", icon: "numbers" },
    ],
  },
  {
    title: "CONVERT TO PDF",
    tools: [
      { name: "Image to PDF", slug: "image-to-pdf", icon: "images" },
      { name: "JPG to PDF", slug: "jpg-to-pdf", icon: "images" },
      { name: "Word to PDF", slug: "word-to-pdf", icon: "word" },
      { name: "Powerpoint to PDF", slug: "powerpoint-to-pdf", icon: "powerpoint" },
      { name: "Excel to PDF", slug: "excel-to-pdf", icon: "excel" },
      { name: "Text to PDF", slug: "text-to-pdf", icon: "text" },
    ],
  },
  {
    title: "CONVERT FROM PDF",
    tools: [
      { name: "PDF to Image", slug: "pdf-to-image", icon: "images" },
      { name: "PDF to JPG", slug: "pdf-to-jpg", icon: "images" },
      { name: "PDF to Word", slug: "pdf-to-word", icon: "word" },
      { name: "PDF to Powerpoint", slug: "pdf-to-powerpoint", icon: "powerpoint" },
      { name: "PDF to Excel", slug: "pdf-to-excel", icon: "excel" },
      { name: "PDF to Text", slug: "pdf-to-text", icon: "text" },
    ],
  },
  {
    title: "PDF SECURITY",
    tools: [
      { name: "Unlock PDF", slug: "unlock-pdf", icon: "lock" },
      { name: "Protect PDF", slug: "protect-pdf", icon: "shield" },
    ],
  },
];

const IMAGE_GROUPS: Group[] = [
  {
    title: "OPTIMIZE IMAGE",
    tools: [
      { name: "Compress Image", slug: "compress-image", icon: "compress" },
      { name: "Compress JPG", slug: "compress-jpg", icon: "compress" },
      { name: "Compress PNG", slug: "compress-png", icon: "compress" },
      { name: "Compress JPEG", slug: "compress-jpeg", icon: "compress" },
      { name: "Compress WEBP", slug: "compress-webp", icon: "compress" },
      { name: "Compress HEIC", slug: "compress-heic", icon: "compress" },
      { name: "Compress BMP", slug: "compress-bmp", icon: "compress" },
    ],
  },
  {
    title: "CONVERT IMAGE",
    tools: [
      { name: "Image to JPG", slug: "image-to-jpg", icon: "images" },
      { name: "Image to PNG", slug: "image-to-png", icon: "images" },
      { name: "Image to JPEG", slug: "image-to-jpeg", icon: "images" },
      { name: "Image to WEBP", slug: "image-to-webp", icon: "images" },
      { name: "WEBP to JPEG", slug: "webp-to-jpeg", icon: "images" },
      { name: "HEIC to JPEG", slug: "heic-to-jpeg", icon: "images" },
    ],
  },
];

function ToolGlyph({ type }: { type: ToolItem["icon"] }) {
  switch (type) {
    case "compress":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="16">
          <path d="M4 14h6v6" />
          <path d="M20 10h-6V4" />
          <path d="M14 10l7-7" />
          <path d="M3 21l7-7" />
        </svg>
      );
    case "word":
      return <span style={{ fontWeight: 800, fontSize: "11px", color: "#fff" }}>W</span>;
    case "powerpoint":
      return <span style={{ fontWeight: 800, fontSize: "11px", color: "#fff" }}>P</span>;
    case "excel":
      return <span style={{ fontWeight: 800, fontSize: "11px", color: "#fff" }}>X</span>;
    case "text":
      return <span style={{ fontWeight: 800, fontSize: "9px", color: "#fff" }}>TXT</span>;
    case "lock":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "shield":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "split":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" x2="8.12" y1="4" y2="15.88" />
          <line x1="14.47" x2="20" y1="14.48" y2="20" />
          <line x1="8.12" x2="12" y1="8.12" y2="12" />
        </svg>
      );
    case "crop":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
          <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
        </svg>
      );
    case "organize":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <rect height="7" width="7" x="3" y="3" />
          <rect height="7" width="7" x="14" y="3" />
          <rect height="7" width="7" x="14" y="14" />
          <rect height="7" width="7" x="3" y="14" />
        </svg>
      );
    case "rotate":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
      );
    case "delete":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "extract":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
      );
    case "numbers":
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="10" x2="14" y1="13" y2="13" />
          <line x1="10" x2="14" y1="17" y2="17" />
        </svg>
      );
    case "images":
    default:
      return (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
          <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
  }
}

export function SiteHeader() {
  const [activeMenu, setActiveMenu] = useState<"pdf" | "image" | null>(null);
  const [prevPathname, setPrevPathname] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (activeMenu !== null) {
      setActiveMenu(null);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleMenu = (menu: "pdf" | "image") => {
    setActiveMenu((curr) => (curr === menu ? null : menu));
  };

  return (
    <header className="site-header" ref={headerRef}>
      <div className="site-header__main">
        <Link className="brand" href="/">
          <span aria-hidden="true" className="brand__mark">AX</span>
          <span>Axel Tools</span>
        </Link>
        <nav aria-label="Main Navigation" className="site-nav">
          <button
            aria-controls="mega-menu-pdf"
            aria-expanded={activeMenu === "pdf"}
            aria-haspopup="true"
            className={`nav-btn ${activeMenu === "pdf" ? "nav-btn--active" : ""}`}
            onClick={() => toggleMenu("pdf")}
            type="button"
          >
            PDF Tools
            <span className="nav-btn__chevron" aria-hidden="true">{activeMenu === "pdf" ? "▲" : "▼"}</span>
          </button>
          <button
            aria-controls="mega-menu-image"
            aria-expanded={activeMenu === "image"}
            aria-haspopup="true"
            className={`nav-btn ${activeMenu === "image" ? "nav-btn--active" : ""}`}
            onClick={() => toggleMenu("image")}
            type="button"
          >
            Image Tools
            <span className="nav-btn__chevron" aria-hidden="true">{activeMenu === "image" ? "▲" : "▼"}</span>
          </button>
        </nav>
        <a
          aria-label="Visit Axel Academic Studio main website"
          className="header-studio-link"
          href="https://axelacademicstudio.my.id/"
          rel="noopener noreferrer"
          target="_blank"
        >
          Axel Studio ↗
        </a>
      </div>

      {activeMenu && (
        <div
          className="mega-menu"
          id={activeMenu === "pdf" ? "mega-menu-pdf" : "mega-menu-image"}
          role="region"
          aria-label={`${activeMenu.toUpperCase()} Tools Navigation`}
        >
          <div className="mega-menu__container">
            {(activeMenu === "pdf" ? PDF_GROUPS : IMAGE_GROUPS).map((group) => (
              <div className="mega-menu__column" key={group.title}>
                <h4 className="mega-menu__group-title">{group.title}</h4>
                <ul className="mega-menu__tool-list">
                  {group.tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        className="mega-menu__tool-link"
                        href={`/tools/${tool.slug}`}
                        onClick={() => setActiveMenu(null)}
                      >
                        <span className="mega-menu__tool-icon">
                          <ToolGlyph type={tool.icon} />
                        </span>
                        <span className="mega-menu__tool-name">{tool.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
