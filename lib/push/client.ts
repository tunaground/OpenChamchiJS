"use client";

import { signOut, type SignOutParams } from "next-auth/react";

export type DeviceStatus = "subscribed" | "unsubscribed" | "denied" | "unsupported";

const SW_URL = "/sw.js";

export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function isSameKey(a: ArrayBuffer | null, publicKeyB64: string): boolean {
  if (!a) return false;
  const left = new Uint8Array(a);
  const right = urlBase64ToUint8Array(publicKeyB64);
  return left.length === right.length && left.every((byte, i) => byte === right[i]);
}

function getPublicKey(): string | null {
  const config = window.__RUNTIME_CONFIG__;
  return config?.pushEnabled ? config.vapidPublicKey ?? null : null;
}

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SW_URL);
  return existing ?? navigator.serviceWorker.register(SW_URL, { scope: "/" });
}

export async function postSubscription(
  subscription: PushSubscription,
  locale: string
): Promise<void> {
  const json = subscription.toJSON();
  const res = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      locale: ["ko", "en", "ja"].includes(locale) ? locale : null,
    }),
  });
  // A watch without a stored subscription would never deliver
  if (!res.ok) {
    throw new Error(`Push subscription rejected: ${res.status}`);
  }
}

async function subscribe(
  registration: ServiceWorkerRegistration,
  publicKey: string,
  locale: string
): Promise<void> {
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });
  await postSubscription(subscription, locale);
}

export async function getDeviceStatus(): Promise<DeviceStatus> {
  if (!isSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration(SW_URL);
  const subscription = await registration?.pushManager.getSubscription();
  return subscription && Notification.permission === "granted" ? "subscribed" : "unsubscribed";
}

/**
 * Asks for permission (if needed) and subscribes this device.
 * Must be called from a click handler: iOS only prompts on user gesture.
 */
export async function ensureDeviceSubscribed(
  locale: string
): Promise<"subscribed" | "denied" | "unsupported"> {
  const publicKey = getPublicKey();
  if (!isSupported() || !publicKey) return "unsupported";

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return "denied";

  const registration = await getRegistration();
  const existing = await registration.pushManager.getSubscription();
  if (existing && isSameKey(existing.options.applicationServerKey, publicKey)) {
    await postSubscription(existing, locale);
  } else {
    await existing?.unsubscribe();
    await subscribe(registration, publicKey, locale);
  }
  return "subscribed";
}

/**
 * App-start sync without prompting: re-subscribes after a VAPID key change
 * and re-posts the subscription so the logged-in user owns this endpoint.
 */
let syncPromise: Promise<void> | null = null;

export function syncDeviceSubscription(locale: string): Promise<void> {
  // The bell remounts on every navigation; sync once per page load
  syncPromise ??= doSyncDeviceSubscription(locale);
  return syncPromise;
}

async function doSyncDeviceSubscription(locale: string): Promise<void> {
  const publicKey = getPublicKey();
  if (!isSupported() || !publicKey || Notification.permission !== "granted") return;

  try {
    const registration = await getRegistration();
    const existing = await registration.pushManager.getSubscription();
    if (!existing) return;

    if (isSameKey(existing.options.applicationServerKey, publicKey)) {
      await postSubscription(existing, locale);
    } else {
      await existing.unsubscribe();
      await subscribe(registration, publicKey, locale);
    }
  } catch (error) {
    console.error("Failed to sync push subscription:", error);
  }
}

/** Detaches this device from the account, then signs out. */
export async function signOutWithPush(options?: SignOutParams): Promise<void> {
  try {
    if (isSupported()) {
      const registration = await navigator.serviceWorker.getRegistration(SW_URL);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
    }
  } catch (error) {
    console.error("Failed to detach push subscription:", error);
  }
  await signOut(options);
}
