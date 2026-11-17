import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Public Sans licenciada (OFL), servida localmente nos pesos utilizados.
// 27/10: teste com Manrope (commit e9f7014) leu "redonda demais"; voltamos —
// é a família do DS Senior e a mesma do Scout 360 Next, a referência do Bruno.
const publicSans = localFont({
  variable: "--font-app",
  display: "swap",
  src: [
    { path: "./fonts/public-sans/PublicSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/public-sans/PublicSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/public-sans/PublicSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/public-sans/PublicSans-Bold.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Central de Vendas — Visão Comercial",
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
        className={`${publicSans.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
