import { GameConnect, createMessage, TARGET, CMD } from "./gamecon";
import { query } from "./../lib/database";
import crypto from "crypto";

/**
 * @summary サクラが送信する応援メッセージ一覧
 */
const sakuraSupportMessage: string[] = [
    "support message test"
];

const sakuraWelcomeMessage: string[] = [
    "welcome message test"
];

/**
 * @summary メッセージテンプレート
 */
interface MessageTemplate {
    Target: number;
    // NOTE: 送信されるコマンドの種類
    // CMD WELCOME: 1, JOIN: 2, EVENT: 3, SEND_JOIN: 100, SEND_EVENT: 101,
    Command: 1 | 2 | 3 | 100 | 101;
    Data: {
        EventId: number;
        FromId: number | 100; // 100はサクラのユーザID
        Payload: {
            Key: string;
            TypeName: string;
            Data: string;
        }[];
    };
    SessionId: string; // サクラには不要
};

/**
 * @summary BOT的なユーザのふるまいをするサービス
 */
export class SakuraConnect {
    // games: any;
    // sessionDic: any;
    // broadcast: any;

    private sakuraMessage: MessageTemplate = {} as MessageTemplate;

    public constructor() {
    }

    /**
     * @summary ユニークユーザを取得するメソッド
     * @param {number} userId 取得したいユニークユーザのID (デフォルトはランダム)
     * @returns ユニークユーザの情報
     */
    private async getUniqueUsers(userId: string = crypto.randomInt(1, 1000).toString()) {
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
     * @summary サクラ機能を提供するメソッド
     * @param {number} waitTime 待ち時間 (ミリ秒)
     * @param {string} toUserId 送信先ユーザID
     */
    public async sakuraConnect(waitTime: number = 0, toUserId: string) {
        try {
            console.time("sakuraConnectTimer");

            // 応援メソッド発火
            // 引数のwaitTimeでデフォルト即時実行と、待ち時間実行を選択できる
            await this.delay(waitTime);

            console.timeEnd("sakuraConnectTimer");

            // ユニークユーザを取得
            let botUserData;
            if (toUserId || toUserId == "-1") {
                // データベースはIDが1から始まるが、配列は0から始まるため、-1する
                let parseId = (parseInt(toUserId) - 1).toString();
                botUserData = this.getUniqueUsers(parseId);
            } else {
                botUserData = this.getUniqueUsers();
            }
            console.log(botUserData);

            // NOTE: ここで応援処理を呼び出す
            createMessage(toUserId, CMD.WELCOME, TARGET.OTHER, botUserData);
        } catch (ex) {
            console.log(ex);
        }
    }

    /**
     * @summary 遅延処理を行うメソッド
     * @param {number} ms 遅延時間 (ミリ秒)
     */
    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
