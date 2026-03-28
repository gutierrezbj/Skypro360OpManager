import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpsManager — Skypro360",
  description: "Plataforma de gestion de operaciones drone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
