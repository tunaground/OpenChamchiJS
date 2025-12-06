import { getTranslations } from "next-intl/server";
import { NotFoundContent } from "./not-found-content";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <NotFoundContent
      code={t("code")}
      message={t("message")}
      backHome={t("backHome")}
    />
  );
}
