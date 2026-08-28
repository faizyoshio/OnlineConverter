import type { Metadata } from "next";
import Link from "next/link";
import "../styles/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Online Converter",
  description: "Convert files locally in your browser.",
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
