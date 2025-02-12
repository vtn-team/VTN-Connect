import { chat, chatWithSession } from "./../lib/chatgpt"
import { getMaster, getGameInfo, getGameEvent } from "./../lib/masterDataCache"
import { MessagePacket, checkMessageAndWrite } from "./../vclogic/vcmessage"
import { getUserFromId, getUserFromHash } from "./../vclogic/vcuser"
import { UserSession, VCUserSession, CMD, TARGET, createMessage, createGameMessage } from "./session"
import { EventRecorder, EventPlayer } from "./eventrec"
import { SakuraConnect } from "./sakuracon"

 
export interface VCActiveUser
{
	UserId: number;
	DisplayName: string;
	ActiveTime: number;
}

export interface UserPortalInterface {
	joinRoom(userId: number, us: UserSession, data: any) : any; //逃げ
	execMessage(data: any) : void;
	removeSession(sessionId: string) : void;
	getActiveUsers() : any;
	sendAPIEvent(data: any) : void;
}

class UserContainer {
	protected userId: number;
	protected userInfo: any;
	protected queue: Array<any>;
	protected session: VCUserSession|null;
	
	constructor(userInfo: any, session: VCUserSession|null) {
		this.userInfo = userInfo;
		this.userId = userInfo.UserId;
		this.session = session;
		this.queue = [];
	}
	
	public getActiveTime() {
		return this.session?.getActiveTime();
	}
	
	public getStat() {
		return {
			UserId: this.userId,
			DisplayName: this.userInfo.DisplayName,
			ActiveTime: this.getActiveTime()
		};
	}
}

//ユーザーポータル
//NOTE: ユーザを管理し、必要なイベントのみをゲームとやりとりする
export class UserPortal {
	users: any;
	sessionDic: any;
	broadcast: any;
	sakura: SakuraConnect;

	constructor(bc: any) {
		this.users = {};
		this.sessionDic = {};
		this.broadcast = bc;
		this.sakura = new SakuraConnect((message: any) => {
			this.cheerMessage(message)
		});
	}
	
	parsePayload(payload: any) {
		let data:any = {};
		let types:any = {};
		if(payload) {
			for(var d of payload) {
				types[d.Key] = d.TypeName;
				
				switch(d.TypeName)
				{
				case "Integer":
					data[d.Key] = Number(d.Data);
					break;
					
				case "String":
					data[d.Key] = d.Data;
					break;
					
				default:
					data[d.Key] = d.Data;
					break;
				}
			}
		}
		return {
			data: data,
			types: types
		};
	}
	
	createdPayload(data: any) {
		let payload:any = [];
		if(data) {
			for(var k in data) {
				payload.push({
					Key: k,
					TypeName: typeof data[k],
					Data: data[k]
				});
			}
		}
		return payload;
	}

	public setupDummyUser() {
		
	}

	public execMessage(data: any) {
		let usePortal = false;
		if(!data["Command"]) return;
		let payload = this.parsePayload(data["Payload"]);
		let userId = this.sessionDic[data.SessionId];
		
		switch(data["Command"])
		{
		case CMD.SEND_EVENT:
		{
			//イベントフック用
			this.sakura.eventHook(data.EventId, data)
		}
		break;
		
		case CMD.SEND_CHEER:
		{
			this.cheerMessage(data);
		}
		break;
		
		case CMD.ERROR:
		{
			console.log(data)
			this.broadcast(createMessage(data.UserId, CMD.ERROR, TARGET.SELF, data));
		}
		break;
		}
		return usePortal;
	}

	async joinRoom(userId: number, us: UserSession, data: any) {
		if(userId === 0) {
			console.log(`GAME ID:0 reject.`);
			return null;
		}
		
		let userInfo = await getUserFromId(userId);
		if(userInfo) {
			let session = new VCUserSession(userId, us);
			this.users[userId] = new UserContainer(userInfo, session);
			this.sessionDic[data.SessionId] = userId;
			console.log(`USER ID:${userId} - ${userInfo.DisplayName} join.`);
			
			return session;
		}else{
			console.log(`USER ID:${userId} not found.`);
		}
		return null;
	}
	
	public removeSession(sessionId: string) {
		if(!this.sessionDic[sessionId]) {
			return;
		}
		
		let userId = this.sessionDic[sessionId];
		delete this.users[userId];
		delete this.sessionDic[sessionId];
		
		console.log(`USER ID:${userId} leave.`);
	}
	
	public getActiveUsers() {
		let users:any = [];
		
		for(var uId in this.users) {
			let stat = this.users[uId].getStat();
			if(stat){
				users.push(stat);
			}
		}
		
		return users;
	}
	
	//処理
	execCommand(data: any) {
		return false;
	}
	
	async cheerMessage(data: any) {
		try {
			let to = data.ToUserId;
			let from = data.FromUserId;
			let msg = data.Data;
			if(!to) {
				to = -1;
			}
			if(!from) {
				from = -1;
			}
			
			let message = {
				ToUserId: to,
				FromUserId: from,
				AvatarType: msg.Avatar,
				Name: msg.Name,
				Message: msg.Message
			}
			
			//Webページにリレーする
			let result:any = {};
			if(msg.Emotion) {
				result = {
					Message: msg.Message,
					Emotion: msg.Emotion
				}
			} else {
				result = await checkMessageAndWrite(message);
			}
			data.Data = result.result;
			this.broadcast(createMessage(to, CMD.CHEER, TARGET.SELF, data));
			
			//応援イベントをゲームに飛ばす
			let evtPacket = {
				AvatarType: msg.Avatar,
				Name: msg.Name,
				Message: result.Message,
				Emotion: result.Emotion
			}
			let evtData = {
				EventId: 1001,
				FromId: from,
				Payload: this.createdPayload(evtPacket)
			};
			this.broadcast(createGameMessage(from, parseInt(data.GameId), CMD.EVENT, TARGET.SELF, evtData));
		}catch(ex){
			console.log(ex);
		}
	}
	
	async execQREvent(data: any) {
		
	}
	
	public sendAPIEvent(data: any) {
		this.sakura.apiHook(data);
		
		switch(data.API) {
		case "createUser":
		case "gameStartAIGame":
		case "gameStartVC":
		case "gameEndAIGame":
		case "gameEndVC":
		}
	}
};
