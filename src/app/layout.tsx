import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "@fontsource-variable/fraunces";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pile",
  description:
    "Pile turns the articles, PDFs, and videos you saved but never read into a daily conversation between two AI hosts. Pause anytime to drop a voice reminder anchored to the exact paragraph being discussed.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "Pile",
    description: "Your saved-and-forgotten content, finally heard.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="dark" suppressHydrationWarning>
        <head>
          {/*
            General Sans is self-hosted from /public/fonts/general-sans/.
            If those files are missing, the font-sans fallback chain
            (system-ui) is what renders.
          */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @font-face {
                  font-family: "General Sans";
                  font-style: normal;
                  font-weight: 400 700;
                  font-display: swap;
                  src: url("/fonts/general-sans/GeneralSans-Variable.woff2")
                    format("woff2-variations");
                }
              `,
            }}
          />
        </head>
        <body>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
