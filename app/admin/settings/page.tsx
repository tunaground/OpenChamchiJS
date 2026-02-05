import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { globalSettingsService } from "@/lib/services/global-settings";
import { isGeoIpAvailable } from "@/lib/ip";
import { AdminSettingsContent } from "./admin-settings-content";

export default async function AdminSettingsPage() {
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  const canUpdate = await permissionService.checkUserPermission(userId, "all:all");

  const settings = await globalSettingsService.get();
  const geoIpAvailable = isGeoIpAvailable();

  const t = await getTranslations("adminSettings");
  const tCommon = await getTranslations("common");
  const tSidebar = await getTranslations("adminSidebar");

  return (
    <AdminSettingsContent
      initialSettings={{
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        countryCode: settings.countryCode,
        homepageContent: settings.homepageContent,
        customLinks: settings.customLinks,
        tripcodeSalt: settings.tripcodeSalt,
      }}
      geoIpAvailable={geoIpAvailable}
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      sidebarLabels={{
        admin: tSidebar("admin"),
        backToHome: tSidebar("backToHome"),
        boards: tSidebar("boards"),
        users: tSidebar("users"),
        roles: tSidebar("roles"),
        settings: tSidebar("settings"),
      }}
      canUpdate={canUpdate}
      labels={{
        title: t("title"),
        siteTitle: t("siteTitle"),
        siteTitlePlaceholder: t("siteTitlePlaceholder"),
        siteTitleDescription: t("siteTitleDescription"),
        siteDescription: t("siteDescription"),
        siteDescriptionPlaceholder: t("siteDescriptionPlaceholder"),
        siteDescriptionDescription: t("siteDescriptionDescription"),
        countryCode: t("countryCode"),
        countryCodePlaceholder: t("countryCodePlaceholder"),
        countryCodeDescription: t("countryCodeDescription"),
        homepageContent: t("homepageContent"),
        homepageContentPlaceholder: t("homepageContentPlaceholder"),
        homepageContentDescription: t("homepageContentDescription"),
        tripcodeSalt: t("tripcodeSalt"),
        tripcodeSaltPlaceholder: t("tripcodeSaltPlaceholder"),
        tripcodeSaltDescription: t("tripcodeSaltDescription"),
        save: t("save"),
        saved: t("saved"),
        geoIpStatus: t("geoIpStatus"),
        geoIpAvailable: t("geoIpAvailable"),
        geoIpUnavailable: t("geoIpUnavailable"),
        geoIpUnavailableDescription: t("geoIpUnavailableDescription"),
        customLinks: t("customLinks"),
        customLinksDescription: t("customLinksDescription"),
        addLink: t("addLink"),
        linkLabel: t("linkLabel"),
        linkLabelPlaceholder: t("linkLabelPlaceholder"),
        linkUrl: t("linkUrl"),
        linkUrlPlaceholder: t("linkUrlPlaceholder"),
        noLinks: t("noLinks"),
        deleteLink: t("deleteLink"),
        cacheManagement: t("cacheManagement"),
        cacheManagementDescription: t("cacheManagementDescription"),
        invalidateAll: t("invalidateAll"),
        invalidating: t("invalidating"),
        invalidated: t("invalidated"),
      }}
    />
  );
}
