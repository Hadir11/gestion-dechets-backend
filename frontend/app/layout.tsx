import type { Metadata } from "next";
import "./globals.css";



export const metadata: Metadata = {
  title: "Gestion des déchets",
  description: "Plateforme municipale - gestion et optimisation de la collecte des déchets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
