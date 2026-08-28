import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Online Converter",
  description: "Convert files locally in your browser.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content">Skip to main content</a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
