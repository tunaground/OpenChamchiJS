import type {Metadata, Viewport} from "next";
import {NextIntlClientProvider} from "next-intl";
import {getLocale, getMessages} from "next-intl/server";
import {Providers} from "./providers";
import StyledComponentsRegistry from "@/lib/registry";
import {globalSettingsService} from "@/lib/services/global-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await globalSettingsService.get();
  return {
    title: settings.siteTitle,
    description: settings.siteDescription,
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&display=swap"
        />
      </head>
      <body>
        <StyledComponentsRegistry>
          <NextIntlClientProvider messages={messages}>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
