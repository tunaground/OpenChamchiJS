import type {Metadata, Viewport} from "next";
import Script from "next/script";
import {NextIntlClientProvider} from "next-intl";
import {getLocale, getMessages} from "next-intl/server";
import {Providers} from "./providers";
import StyledComponentsRegistry from "@/lib/registry";
import {globalSettingsService} from "@/lib/services/global-settings";
import {isPushFeatureEnabled} from "@/lib/push/feature";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await globalSettingsService.get();
  return {
    title: settings.siteTitle,
    description: settings.siteDescription,
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
  const settings = await globalSettingsService.get();
  const pushEnabled = isPushFeatureEnabled(settings);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&display=swap"
        />
        {/* Apply the saved color mode before first paint so dark mode doesn't flash light */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{var m=(JSON.parse(localStorage.getItem("theme")||"{}").state||{}).mode;` +
          `if(m==="system")m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";` +
          `document.documentElement.dataset.mode=m==="dark"?"dark":"light"}catch(e){}`
        }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html:
          `window.__RUNTIME_CONFIG__=${JSON.stringify({
            realtimeProvider: settings.realtimeProvider || null,
            wsServerUrl: settings.realtimeWsUrl || null,
            pushEnabled,
            vapidPublicKey: pushEnabled ? settings.vapidPublicKey : null,
          })}`
        }} />
        <StyledComponentsRegistry>
          <NextIntlClientProvider messages={messages}>
            <Providers siteTitle={settings.siteTitle}>{children}</Providers>
          </NextIntlClientProvider>
        </StyledComponentsRegistry>
        {settings.gaTrackingId && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaTrackingId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.gaTrackingId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
