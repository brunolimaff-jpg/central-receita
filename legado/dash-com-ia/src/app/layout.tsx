import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Public Sans licenciada (OFL), servida localmente nos pesos utilizados.
const publicSans = localFont({
  variable: "--font-public-sans",
  display: "swap",
  src: [
    { path: "./fonts/public-sans/PublicSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/public-sans/PublicSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/public-sans/PublicSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/public-sans/PublicSans-Bold.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Central de Receita — Visão Comercial · Demonstração local",
  description:
    "Leitura comercial local, com oportunidades demonstrativas, ações, compromissos e contexto de relacionamento. A origem dos dados é identificada em cada leitura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${publicSans.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
