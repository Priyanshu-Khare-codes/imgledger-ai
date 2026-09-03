import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImgLedger AI — Biometric Face Verification & Blockchain Ledger",
  description: "End-to-end local python pipeline combining InsightFace ArcFace 512-D vector embeddings, Yandex reverse web search, and SHA-256 canonical blockchain fingerprinting.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/icon.png" type="image/png" />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
