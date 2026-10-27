import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Manrope licenciada (OFL), servida localmente como variável 200–800.
// Escolha de produto (27/10/2026): substitui a Public Sans oficial do DS Senior
// por leitura que Bruno aprovou melhor; troca registrada como adaptação local.
const manrope = localFont({
  variable: "--font-app",
  display: "swap",
  src: [
    { path: "./fonts/manrope/Manrope-Variable.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/manrope/Manrope-Variable-latin-ext.woff2", weight: "200 800", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Central de Receita — Visão Comercial",
  description:
    "Leitura comercial demonstrativa, com oportunidades, ações, compromissos e contexto de relacionamento. A origem dos dados é identificada em cada leitura.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${manrope.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
