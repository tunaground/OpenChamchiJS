import type {Metadata, Viewport} from "next";
import Script from "next/script";
import {NextIntlClientProvider} from "next-intl";
import {getLocale, getMessages} from "next-intl/server";
import {Providers} from "./providers";
import StyledComponentsRegistry from "@/lib/registry";
import {globalSettingsService} from "@/lib/services/global-settings";
import {isPushFeatureEnabled} from "@/lib/push/feature";
import {DEFAULT_FONT, fontBootScript, resolveFont} from "@/lib/theme/fonts";

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
        {/* Apply the saved color mode before first paint so dark mode doesn't flash light */}
        <script dangerouslySetInnerHTML={{ __html:
          `try{var m=(JSON.parse(localStorage.getItem("theme")||"{}").state||{}).mode;` +
          `if(m==="system")m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";` +
          `document.documentElement.dataset.mode=m==="dark"||m==="grey"?m:"light"}catch(e){}`
        }} />
        {/* Apply the saved body font before first paint and load only its stylesheet (lib/theme/fonts.ts).
            These scripts come before any stylesheet: a script waits for the stylesheets above it,
            which would hold back the font request */}
        <script dangerouslySetInnerHTML={{ __html: fontBootScript() }} />
        <noscript>
          <link rel="stylesheet" href={resolveFont(DEFAULT_FONT).stylesheet ?? undefined} />
        </noscript>
        {/* The body font's stylesheet is added by the script above, where the browser can't find it early */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&display=swap"
        />
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
