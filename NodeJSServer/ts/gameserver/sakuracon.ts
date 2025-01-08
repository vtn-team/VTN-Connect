import { WebSocket, WebSocketServer } from "ws";
import { GameConnect, createMessage, TARGET, CMD } from "./gamecon";
import { MessagePacket } from "./../vclogic/vcmessage";

const delay = (waitTime: number) =>
    new Promise((resolve) => setTimeout(resolve, waitTime));

/**
 * @summary BOT的なユーザのふるまいをするサービス
 */
export class SakuraConnect implements MessagePacket  {
    // games: any;
    // sessionDic: any;
    // broadcast: any;

    ToUserId: number;
    FromUserId: number;
    Name: string;
    Message: string;

    public constructor() {
        // MessagePacketの初期化
        this.ToUserId = 0;
        this.FromUserId = 0;
        this.Name = "";
        this.Message = "";
    }


    /**
     * @summary 応援ユーザ(BOT)の名前とメッセージを読み込む
     * @param {string} filepath ユーザデータファイルのパス
     */
    private async readUserDataFile(filepath: string) {
        // NOTE: BOTユーザーのデータをひとまずテキストファイルから読み込む
        try {
        } catch (err) {
            console.error(err);
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
        let botUserData: MessagePacket = {
            ToUserId: 0,
            FromUserId: 0,
            Name: "サクラ",
            Message: "サクラです。よろしくお願いします。"
        };
        this.ToUserId = botUserData.ToUserId;
        this.FromUserId = botUserData.FromUserId;
        this.Name = botUserData.Name;
        this.Message = botUserData.Message
        
        // NOTE: ここで応援処理を呼び出す
        createMessage(this.ToUserId.toString(), CMD.WELCOME, TARGET.OTHER, { "UserId": toUserId });
    }
}
