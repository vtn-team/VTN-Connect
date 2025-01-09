import { WebSocket, WebSocketServer } from "ws";
import { GameConnect, createMessage, TARGET, CMD } from "./gamecon";
import { MessagePacket } from "./../vclogic/vcmessage";
import { query } from "./../lib/database";
import crypto from "crypto";

const delay = (waitTime: number) =>
    new Promise((resolve) => setTimeout(resolve, waitTime));

/**
 * @summary BOT的なユーザのふるまいをするサービス
 */
export class SakuraConnect implements MessagePacket {
    // games: any;
    // sessionDic: any;
    // broadcast: any;

    ToUserId: number;
    FromUserId: number;
    Name: string;
    Message: string;

    public constructor() {
        // MessagePacketの初期化
        this.ToUserId = -1;
        this.FromUserId = -1;
        this.Name = "";
        this.Message = "";
    }

    /**
     * @summary ユニークユーザを取得するメソッド
     * @param {number} userId 取得したいユニークユーザのID (デフォルトはランダム)
     * @returns {Promise<any>} ユニークユーザの情報
     */
    private async getUniqueUsers(userId: string = crypto.randomInt(1, 1000).toString()): Promise<any> {
        // TODO: ts/vclogic/vcuser.tsにユニークユーザーを格納している変数があるので、それを使ってもいいかもしれない
        try {
            let botUserData = await query(
                "SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id < ?",
                [999]
            ); 
            let users: any = [];
            users = botUserData;

            return users[userId];
        } catch (ex) {
            console.log(ex);
        }
    }

    /**
     * @summary サクラ機能を提供するメソッド
     * @param waitTime 待ち時間 (ミリ秒)
     * @param toUserId 送信先ユーザID
     */
    public async sakuraConnect(waitTime: number = 0, toUserId: number) {
        // 応援メソッド発火
        // 引数のwaitTimeでデフォルト即時実行と、待ち時間実行を選択できる
        await delay(waitTime);

        // NOTE: ここでデータベースからBOTユーザーのデータを読み込む

        // これは仮データ
        let botUserData: MessagePacket = {
            ToUserId: -1,
            FromUserId: -1,
            Name: "サクラ",
            Message: "サクラです。よろしくお願いします。",
        };
        this.ToUserId = botUserData.ToUserId;
        this.FromUserId = botUserData.FromUserId;
        this.Name = botUserData.Name;
        this.Message = botUserData.Message;

        // NOTE: ここで応援処理を呼び出す
        createMessage(this.ToUserId.toString(), CMD.WELCOME, TARGET.OTHER, {
            UserId: toUserId,
        });
    }
}
