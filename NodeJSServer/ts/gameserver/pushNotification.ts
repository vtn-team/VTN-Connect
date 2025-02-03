import * as webPush from "web-push";
import { PushSubscription } from "web-push";
import { PUSH_PRIVATE_KEY, PUSH_PUBLIC_KEY } from "../config/config";
import { query } from "./../lib/database";
import { AccessAnalyzer } from "aws-sdk";

export type PushNotificationMessage = {
    title: string; // 通知のタイトル
    body: string; // 通知の本文
    url?: string; // 通知をクリックしたときに開く URL
};

/**
 * @summary 指定されたユーザーIDにプッシュ通知を送信します。
 *
 * @param {string} userId - プッシュ通知を送信する対象のユーザーID。
 * @param {PushNotificationMessage} message - 送信するプッシュ通知のメッセージ内容。
 * @returns {Promise<void>} - プッシュ通知の送信が完了したら解決されるPromise。
 * @throws {Error} - プッシュ通知の送信中にエラーが発生した場合。
 */
export const sendPushNotification = async (userId: string, message: PushNotificationMessage): Promise<void> => {
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

        await Promise.all(pushSubscriptions.map((sub) => webPush.sendNotification(sub, JSON.stringify(message))));

        console.log(`successfully sent web push to ${userId}.`, message);
    } catch (error) {
        console.warn("Error sending web push to ${userId}.", error);
    }
};