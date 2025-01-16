import { GameConnect, createMessage, TARGET, CMD } from "./gamecon";
import { query } from "./../lib/database";
import crypto from "crypto";

/**
 * @summary サクラのメッセージと感情値のタプル
 */
type messageEmotionTuple = {
    message: string;
    emotionValue: string;
};
// サクラのメッセージ一覧
const sakuraWelcomeMessage: messageEmotionTuple[] = [{ message: "welcome message test", emotionValue: "50" }];
const sakuraSupportMessage: messageEmotionTuple[] = [{ message: "support message test", emotionValue: "50" }];

/**
 * @summary メッセージテンプレート
 */
type messageTemplate = {
    Target: number;
    Command: CMD;
    Data: {
        EventId: number;
        FromId: number; //サクラのユーザID
        Payload: [
            {
                Key: "Emotion";
                TypeName: "Int32";
                Data: string;
            },
            {
                Key: "Message";
                TypeName: "String";
                Data: string;
            }
        ];
        SessionId: ""; // サクラには不要
    };
};

/**
 * @summary BOT的なユーザのふるまいをするサービス
 */
export class SakuraConnect {
    // games: any;
    // sessionDic: any;
    // broadcast: any;
    public constructor() {}

    /**
     * @summary ユニークユーザを取得するメソッド
     * @param {number} userId 取得したいユニークユーザのID
     * @returns ユニークユーザの情報
     */
    private async getUniqueUsers(userId: number) {
        // TODO: ts/vclogic/vcuser.tsにユニークユーザーを格納している変数があるので、それを使ってもいいかもしれない
        try {
            let botUserData = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id < ?", [999]);
            let users: any = [];
            users = botUserData;

            return users[userId];
        } catch (ex) {
            console.log(ex);
        }
    }

    /**
     * @summary サクラのメッセージを生成するメソッド
     * @param {number} toUserId 送信先ユーザID
     * @param {number} fromUserId 送信元ユーザID
     * @param {CMD} messageType 送信メッセージの種類
     */
    private async createSakuraMessage(toUserId: number, fromUserId: number, messageType: CMD): Promise<messageTemplate> {
        // ユニークユーザを取得
        let botUserData;
        let uniqueId: number;
        if (!fromUserId || fromUserId != -1) {
            // データベースはIDが1から始まるが、配列は0から始まるため、-1する
            uniqueId = fromUserId - 1;
        } else {
            // TODO: ちゃんと有効なユニークユーザーのデータ範囲を決める
            // NOTE: 1<=n<999の範囲がユニークユーザーデータの範囲
            uniqueId = crypto.randomInt(1, 999);
        }
        botUserData = await this.getUniqueUsers(uniqueId);

        // ランダムでメッセージを選択するための数値を生成
        let randomMessageNumber = crypto.randomInt(0, sakuraWelcomeMessage.length);

        // ユニークユーザが取得できない場合は、再度取得する
        while (!botUserData) {
            uniqueId = crypto.randomInt(1, 999);
            botUserData = await this.getUniqueUsers(uniqueId);
        }

        // 送信タイミングを判定し、送信するデータを選択する
        let sendMessageData: messageEmotionTuple;
        if (messageType == CMD.WELCOME) {
            sendMessageData = sakuraWelcomeMessage[randomMessageNumber];
        } else {
            sendMessageData = sakuraSupportMessage[randomMessageNumber];
        }

        // メッセージを生成
        let message: messageTemplate = {
            Target: toUserId,
            Command: CMD.SEND_EVENT,
            Data: {
                EventId: 1001,
                FromId: uniqueId,
                Payload: [
                    {
                        Key: "Emotion",
                        TypeName: "Int32",
                        Data: sendMessageData.emotionValue,
                    },
                    {
                        Key: "Message",
                        TypeName: "String",
                        Data: sendMessageData.message,
                    },
                ],
                SessionId: "",
            },
        };
        return message;
    }

    /**
     * @summary 挨拶メッセージを送信するメソッド
     * @param {number} waitTime 待ち時間 (ミリ秒)
     * @param {number} toUserId 送信先ユーザID
     * @param {number} fromUserId 送信元ユーザID (未指定の場合ランダムで選択)
     * @returns {Promise<any>} 送信データ
     */
    public async sendWelcomeMessage(waitTime: number = 0, toUserId: number, fromUserId: number = -1): Promise<any> {
        let sendData;
        try {
            sendData = this.createSakuraMessage(toUserId, fromUserId, CMD.WELCOME);
        } catch (ex) {
            console.warn(`SendMessageError: ${ex}`);
        }
        await this.delay(waitTime);
        return sendData;
    }

    /**
     * @summary 応援メッセージを送信するメソッド
     * @param {number} toUserId 送信先ユーザID
     * @param {number} fromUserId 送信元ユーザID (未指定の場合ランダムで選択)
     * @returns {Promise<any>} 送信データ
     */
    public async sendSupportMessage(toUserId: number, fromUserId: number = -1): Promise<any> {
        // TODO: 難易度とゲームの内容を見てから、どのタイミングで応援が必要そうかを決める
        let sendData;
        try {
            sendData = this.createSakuraMessage(toUserId, fromUserId, CMD.SEND_JOIN);
        } catch (ex) {
            console.warn(`SendMessageError: ${ex}`);
        }
        return sendData;
    }

    /**
     * @summary 遅延処理を行うメソッド
     * @param {number} ms 遅延時間 (ミリ秒)
     */
    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
