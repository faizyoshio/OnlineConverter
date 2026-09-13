import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "../styles/tokens.css";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#241b18",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Online Converter — Local-First File Tools",
    template: "%s | OnlineConverter",
  },
  description: "Convert, edit, and manipulate PDF documents, images, and archives directly in your browser. 100% private, files never leave your device.",
  applicationName: "OnlineConverter",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "OnlineConverter",
    title: "Online Converter — Local-First File Tools",
    description: "Convert, edit, and manipulate PDF documents, images, and archives directly in your browser. 100% private, files never leave your device.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Converter — Local-First File Tools",
    description: "Convert, edit, and manipulate PDF documents, images, and archives directly in your browser. 100% private, files never leave your device.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <header className="site-header">
          <Link className="brand" href="/">
            <span aria-hidden="true" className="brand__mark">OC</span>
            <span>Online Converter</span>
          </Link>
          <p className="header-note">Local-first file tools</p>
        </header>
        <main className="page-shell" id="main-content">{children}</main>
        <footer className="site-footer">
          <p>Built for local, browser-based processing.</p>
          <p>No conversion history is stored.</p>
        </footer>
      </body>
    </html>
  );
}
