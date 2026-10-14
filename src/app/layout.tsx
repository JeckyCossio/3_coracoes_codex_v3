import type { Metadata, Viewport } from "next";
import "./styles.css";
export const metadata: Metadata = {
  title: "TRES Ajuda · protótipo",
  description: "Jornada de autoatendimento para máquinas TRES"
};
export const viewport: Viewport = { themeColor: "#0E0E0F", colorScheme: "dark" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"/>
      <link rel="preload" href="/fonts/Oscine.woff" as="font" type="font/woff" crossOrigin="anonymous"/>
      <link rel="preload" href="/fonts/Magistral.woff" as="font" type="font/woff" crossOrigin="anonymous"/>
    </head>
    <body>{children}</body>
  </html>;
}
