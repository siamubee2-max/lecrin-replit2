/**
 * Notification service using Expo Push API.
 *
 * Sends push notifications via https://exp.host/--/api/v2/push/send.
 * Push tokens should be registered by clients and stored in the DB.
 */
import { TRPCError } from "@trpc/server";

export type NotificationPayload = {
  title: string;
  content: string;
  pushToken?: string; // Expo push token (ExponentPushToken[...])
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content, pushToken: input.pushToken };
};

/**
 * Send a push notification via Expo Push API.
 * Returns `true` if the request was accepted, `false` otherwise.
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content, pushToken } = validatePayload(payload);

  // If no push token provided, log and return
  if (!pushToken) {
    console.log(`[Notification] No push token — notification skipped: ${title}`);
    return false;
  }

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body: content,
        sound: "default",
        priority: "high",
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Expo Push failed (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`,
      );
      return false;
    }

    const result = (await response.json()) as { data?: { status?: string } };
    if (result.data?.status === "ok") {
      console.log("[Notification] Push notification sent successfully");
      return true;
    }

    console.warn("[Notification] Expo Push returned non-ok status:", result);
    return false;
  } catch (error) {
    console.warn("[Notification] Error sending push notification:", error);
    return false;
  }
}
