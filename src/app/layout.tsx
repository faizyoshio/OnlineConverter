import type { Metadata, Viewport } from "next";
import "../styles/tokens.css";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#241b18",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "ScholarKit — Private Academic & Research Document Tools",
    template: "%s | ScholarKit",
  },
  description: "Private, local-first document tools for students and researchers. Format thesis papers, paginate manuscripts, optimize publication figures, and convert conference deadlines with 100% browser-based privacy.",
  applicationName: "ScholarKit",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ScholarKit",
    title: "ScholarKit — Private Academic & Research Document Tools",
    description: "Private, local-first document tools for students and researchers. Format thesis papers, paginate manuscripts, optimize publication figures, and convert conference deadlines with 100% browser-based privacy.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScholarKit — Private Academic & Research Document Tools",
    description: "Private, local-first document tools for students and researchers. Format thesis papers, paginate manuscripts, optimize publication figures, and convert conference deadlines with 100% browser-based privacy.",
  },
};

import { SiteHeader } from "@/components/navigation/site-header";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <SiteHeader />
        <main className="page-shell" id="main-content">{children}</main>
        <footer className="site-footer">
          <p>Built for local, browser-based research workflows.</p>
          <p>100% private. Thesis drafts and research papers never leave your device.</p>
        </footer>
      </body>
    </html>
  );
}
