import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "RayMindset — Welcome to Ray's Mind",
  description: "Explore the ideas, ventures, travels, writing, and experiences of Rayansh Singh.",
  openGraph: {
    title: "RayMindset — Welcome to Ray's Mind",
    description: "Explore the ideas, ventures, travels, writing, and experiences of Rayansh Singh.",
    type: "website",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export const viewport = {
  themeColor: "#f1f2ef",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-50 -translate-y-24 bg-paper px-5 py-3 font-semibold text-ground transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
