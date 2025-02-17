import * as webPush from "web-push";
import { PushSubscription } from "web-push";
import { PUSH_PRIVATE_KEY, PUSH_PUBLIC_KEY } from "../config/config";
import { query } from "./../lib/database";

/**
 * ユーザーのプッシュサブスクリプションをデータベースに保存します。
 *
 * @param userId - サブスクリプションを保存するユーザーのID。
 * @param subscription - エンドポイントとキーを含むプッシュサブスクリプションオブジェクト。
 * @returns サブスクリプションが保存されたときに解決されるPromise。
 */
export const savePushSubscription = async (userId: string, subscription: PushSubscription): Promise<void> => {
  let result = await query("INSERT INTO pushSubscription (UserId, endpoint, auth, p256dh) VALUES (?, ?, ?, ?)", [userId, subscription.endpoint, subscription.keys.auth, subscription.keys.p256dh]);
};

export type PushNotificationMessage = {
  title: string; // 通知のタイトル
  body: string; // 通知の本文
  url?: string; // 通知をクリックしたときに開く URL
};

/**
 * @summary 指定されたユーザーIDにプッシュ通知を送信します。
 * @param {string} userId - プッシュ通知を送信する対象のユーザーID。
 * @returns {Promise<void>} - プッシュ通知の送信が完了したら解決されるPromise。
 * @throws {Error} - プッシュ通知の送信中にエラーが発生した場合。
 */
export const sendPushNotification = async (userId: string): Promise<void> => {
  const message = {
    title: "新しい通知",
    body: "新しい通知が届きました。",
    url: "https://example.com/",
  };

  try {
    // Web Push の設定
    // TODO: mailto のメールアドレスを実際のメールアドレスに変更する
    webPush.setVapidDetails("mailto:info@test.com", PUSH_PUBLIC_KEY, PUSH_PRIVATE_KEY);

    // クエリでプッシュ通知の購読情報を取得
    const subscriptions = await query("SELECT endpoint, auth, p256dh FROM pushSubscription WHERE UserId = ?", [userId]);
    if (subscriptions.length === 0) {
      return;
    }

    const pushSubscriptions: PushSubscription[] = subscriptions.map((sub: any) => {
      return {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };
    });

    // プッシュ通知を登録されたUserへ一斉送信
    await Promise.all(pushSubscriptions.map((sub) => webPush.sendNotification(sub, JSON.stringify(message))));

    console.log(`successfully sent web push to ${userId}.`, message);
  } catch (error) {
    console.warn(`Error sending web push to ${userId}.`, error);
  }
};

// VAPIDキーをUint8Arrayに変換する関数
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = Buffer.from(base64, "base64");
  return new Uint8Array(rawData);
}
