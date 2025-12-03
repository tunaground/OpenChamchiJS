import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // Check cookie first
  let locale = cookieStore.get("NEXT_LOCALE")?.value;

  // Then check Accept-Language header
  if (!locale) {
    const acceptLanguage = headerStore.get("accept-language");
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(",")[0].split("-")[0];
      if (routing.locales.includes(preferred as "ko" | "en")) {
        locale = preferred;
      }
    }
  }

  // Fallback to default
  if (!locale || !routing.locales.includes(locale as "ko" | "en")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
