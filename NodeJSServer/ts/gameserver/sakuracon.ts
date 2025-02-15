import { GameConnect } from "./gamecon";
import { chat } from "./../lib/chatgpt"
import { getMaster, getAIRule } from "./../lib/masterDataCache"
import { CMD, TARGET, createMessage } from "./session"
import { getAllUniqueUsers, preloadUniqueUsers } from "./../vclogic/vcuser";
import { query } from "./../lib/database";
const crypto = require("crypto");

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
	games: any;
	sessionDic: any;
	msgSender: any;
	sakuraEvents: Array<any>;
	sakuraUsers: Array<any>;

	constructor(msgSender: any) {
		this.games = {};
		this.sessionDic = {};
		this.msgSender = msgSender;
		this.sakuraUsers = getAllUniqueUsers();
		this.sakuraEvents = [];
		this.setupMaster();
	}
	
	setupMaster() {
		let events = getMaster("SakuraEvent");
		for(let evt of events) {
			let data:any = {
				Params: [0,0]
			};
			for(let k in evt) {
				switch(k) {
				case "GameId":
					data[k] = parseInt(evt[k]);
					break;
					
				case "SendFlag":
					data[k] = evt[k].split(",").map((d:string) => d.trim());
					break;
					
				case "ParamA":
					data.Params[0] = parseInt(evt[k]);
					break;
				case "ParamB":
					data.Params[1] = parseInt(evt[k]);
					break;
					
				default:
					data[k] = evt[k];
					break;
				}
			}
			this.sakuraEvents.push(data);
		}
	}
	
	/**
	 * @summary 関連するイベント処理を拾う
	 * @returns イベントリスト
	 */
	private getEvents(trigger: string) : Array<any> {
		let ret = [];
		for(let evt of this.sakuraEvents) {
			if(evt.Trigger != trigger) continue;
			ret.push(evt);
		}
		return ret;
	}
	
    /**
     * @summary ユニークユーザを取得するメソッド
     * @param {number} userId 取得したいユニークユーザのID
     * @returns ユニークユーザの情報
     */
    private async getUniqueUsers(userId: number) {
        try {
            let botUserData = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id < ?", [999]);
            let users: any = [];
            users = botUserData;

            return users[userId];
        } catch (ex) {
            console.log(ex);
        }
    }
    
	getSakuraUser(sendFlag: Array<string>) {
		let ret = [];
		if(sendFlag.indexOf("PS22Users") != -1 && sendFlag.indexOf("PS23Users") != -1) {
			return this.sakuraUsers;
		}
		else if(sendFlag.indexOf("PS22Users") != -1 && sendFlag.indexOf("PS23Users") == -1) {
			for(let u of this.sakuraUsers) {
				if(u.Id >= 30) continue;
				ret.push(u);
			}
		}
		else if(sendFlag.indexOf("PS22Users") == -1 && sendFlag.indexOf("PS23Users") != -1) {
			for(let u of this.sakuraUsers) {
				if(u.Id < 30) continue;
				if(u.Id >= 100) continue;
				ret.push(u);
			}
		}
		else {
			for(let u of this.sakuraUsers) {
				if(u.Id != 100) continue;
				ret.push(u);
			}
		}
		return ret;
	}
	
	getUserDataPrompt(userData: any) {
		return `
- 以下を参照すること\n
  - 性別: ${userData.Gender}
  - 年齢: ${userData.Age}
  - 性格: ${userData.Personality}
  - モチベーション: ${userData.Motivation}
  - 弱点: ${userData.Weaknesses}
  - バックストーリー: ${userData.Background}
`;
	}

	async execSakura(evt: any, data: any) {
		let users = this.getSakuraUser(evt.SendFlag);
		let index = crypto.randomInt(0, users.length);
		let userId = data.UserId;
		let delay = 0;
		
		//SendFlagによる振る舞い
		if(evt.SendFlag.indexOf("Random") != -1) {
			if(crypto.randomInt(0, 10) < 5) return ;
		}
		
		let prompt = getAIRule(evt.SakuraKey).RuleText;
		prompt = prompt.replace("<Description>", evt.Description);
		//prompt = prompt.replace("<TargetUser>", JSON.stringify(data.UserData));
		prompt = prompt.replace("<User>", this.getUserDataPrompt(users[index]));
		prompt += `
# 出力(JSON)
{
	"Message": [考えたメッセージ(公共の電波に発信してよいもの)],
	"Emotion": [-100～100],
}`;
		
		let chatres:any = await chat(prompt);
		let aimsg = JSON.parse(chatres.content);
	
		//Triggerによる振る舞い
		switch(evt.Trigger) {
		case "GameStart":
			//GameStartはParamsの範囲内で遅延する
			delay = evt.Params[0] + crypto.randomInt(0, evt.Params[1]);
			
			//AIゲームの場合登場順を考慮
			if(data.API == "gameStartAIGame") {
				delay += (data.Index * 3000) + 1500;
			}
			break;
		}
		
		//0を避ける
		if(aimsg.Emotion == 0) {
			aimsg.Emotion = 1;
		}
		
		//SessionIdをキーにしてJoinを返す
		let msgData = {
			Avatar: users[index].AvatarType,
			Name: users[index].DisplayName,
			Message: aimsg.Message,
			Emotion: aimsg.Emotion
		};
		
		let json = {
			Command: CMD.SEND_CHEER,
			GameId: evt.GameId,
			ToUserId: userId,
			FromUserId: users[index].UserId,
			Data: msgData
		};
		
		//遅延処理がある場合はそう実行する
		if(delay > 0)
		{
			setTimeout(async () => {
				//DBに保存
				await query("INSERT INTO Message (ToUserId, FromUserId, AvatarType, Message, Emotion) VALUES (?, ?, ?, ?, ?)", [json.ToUserId, json.FromUserId, json.Data.Avatar, json.Data.Message, json.Data.Emotion]);
				this.msgSender(json);
			}, delay);
		}
		else
		{
			//DBに保存
			await query("INSERT INTO Message (ToUserId, FromUserId, AvatarType, Message, Emotion) VALUES (?, ?, ?, ?, ?)", [json.ToUserId, json.FromUserId, json.Data.Avatar, json.Data.Message, json.Data.Emotion]);
			this.msgSender(json);
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

        let uniqueUsers = getAllUniqueUsers();
        botUserData = uniqueUsers[uniqueId];

        // ランダムでメッセージを選択するための数値を生成
        let randomMessageNumber = crypto.randomInt(0, sakuraWelcomeMessage.length);

        // ユニークユーザが取得できない場合は、再度取得する
        while (!botUserData) {
            uniqueId = crypto.randomInt(1, 999);
            botUserData = uniqueUsers[uniqueId];
        }

        // 送信タイミングを判定し、送信するデータを選択する
        let sendMessageData: messageEmotionTuple;
        // TODO: Enumが適切かを確認する
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
     * @param {number} toUserId 送信先ユーザID
     * @param {number} fromUserId 送信元ユーザID (未指定の場合ランダムで選択)
     * @param {number} waitTime 待ち時間 (ミリ秒)
     * @returns {Promise<any>} 送信データ
     */
    public async sendWelcomeMessage(toUserId: number, fromUserId: number = -1, waitTime: number = 0): Promise<any> {
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
     * @returns {any} 送信データ
     */
    // TODO: 応援を訳すとSupportになったが、イケてないのでいずれ変更する
    public sendSupportMessage(toUserId: number, fromUserId: number = -1, event?: any): any {
        // TODO: 難易度とゲームの内容を見てから、どのタイミングで応援が必要そうかを決める
        // TODO: 今後{event}を送ってもらう場合があるので、一応引数を設定しておく
        let sendData;
        try {
            sendData = this.createSakuraMessage(toUserId, fromUserId, CMD.SEND_JOIN);
        } catch (ex) {
            console.warn(`SendMessageError: ${ex}`);
        }
        return sendData;
    }

    /**
     * @summary 運営メッセージを送信するメソッド
     * @param {string} adminMessage 運営メッセージ
     * @returns {any} 送信データ
     */
    public sendAdminMessage(adminMessage: string): any {
        try {
            // TODO: おそらく運営メッセージもこの形式で送信する
            return {
                Target: 0,
                Command: CMD.EVENT,
                Data: {
                    EventId: 1001,
                    FromId: -1,
                    Payload: [
                        {
                            Key: "Emotion",
                            TypeName: "Int32",
                            Data: "99",
                        },
                        {
                            Key: "Message",
                            TypeName: "String",
                            Data: adminMessage,
                        },
                    ],
                    SessionId: "",
                },
            };
        } catch (ex) {
            console.warn(`SendMessageError: ${ex}`);
        }
    }
    
    /**
     * @summary 遅延処理を行うメソッド
     * @param {number} ms 遅延時間 (ミリ秒)
     */
    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    
	/**
	* @summary イベントトリガー用のリレー関数
	* @param {number} イベントID
	* @param {any} APIデータ
	*/
	public apiHook(data:any) {
		switch(data.API) {
			case "createUser":
			{
				/*
				data = {
					API: "createUser",
					UserData: result
				}
				*/
				let evts = this.getEvents("Register");
				for(let s of evts) {
					this.execSakura(s, data);
				}
			}
			break;

		case "gameStartAIGame":
			{
				/*
				data = {
					API: "gameStartAIGame",
					GameHash: gameHash,
					GameId: gameId,
					GameTitle: title,
					GameUsers: users,
				}
				*/
				let evts = this.getEvents("GameStart");
				for(let evt of evts) {
					if(evt.GameId != data.GameId) continue;
					
					let index = 0;
					for(let ud of data.GameUsers) {
						let d = {
							API: "gameStartAIGame",
							GameHash: data.GameHash,
							GameId: data.GameId,
							GameTitle: data.GameTitle,
							UserId: ud.UserId,
							UserData: ud,
							Index: index++
						};
						this.execSakura(evt, d);
					}
				}
			}
			break;
			
		case "gameStartVC":
			{
				/*
				data = {
					API: 'gameStartVC',
					GameHash: 'hash',
					GameId: gameId,
					UserId: userId,
					UserData: userInfo,
				}
				*/
				let evts = this.getEvents("GameStart");
				for(let evt of evts) {
					if(evt.GameId != data.GameId) continue;
					this.execSakura(evt, data);
				}
			}
			break;

		case "gameEndAIGame":
		case "gameEndVC":
			break;
		}
	}

	/**
	* @summary イベントトリガー用のリレー関数
	* @param {number} イベントID
	* @param {any} イベントデータ
	*/
	public eventHook(eventId:number, data:any) {
		let evts = this.getEvents("EventHook");
		for(let s of evts) {
			if(s.Params[0] != eventId) continue;
			if(s.GameId != data.GameId) continue;

			this.execSakura(s, data);
		}
	}
}
