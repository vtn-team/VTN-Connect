import { chat, chatWithSession } from "./../lib/chatgpt"
import { getMaster, getGameInfo, getGameEvent } from "./../lib/masterDataCache"
import { MessagePacket, checkMessageAndWrite, recordFriendShip } from "./../vclogic/vcmessage"
import { getUserFromId, getUserFromHash } from "./../vclogic/vcuser"
import { UserSession, VCUserSession, VCBridgeSession, CMD, TARGET, createMessage, createGameMessage } from "./session"
import { EventRecorder, EventPlayer } from "./eventrec"

 
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
	cheerMessage(data: any) : void;
	sendAPIEvent(data: any) : void;
}

export class UserPortalBridge {
	protected client: VCBridgeSession|null;
	
	constructor(cli: VCBridgeSession|null) {
		this.client = cli;
	}

	public execMessage(data: any) {
		if(this.client?.isBridgeSession(data.SessionId)) {
			return ;
		}
		
		console.log("execMessage-up");
		console.log(data);
		data.BridgeMarking = 1;
		let msg = JSON.stringify(data);
		this.client?.sendMessage(msg);
	}

	async joinRoom(userId: number, us: UserSession, data: any) {
		//ここにきてはいけない
		console.log("bad case join");
		return null;
	}
	
	public removeSession(sessionId: string) {
		//ここにきてはいけない
		console.log("bad case leave");
	}
	
	public getActiveUsers() {
		//TODO
		//もらってる情報を処理
		let users:any = [];
		
		return users;
	}
	
	public cheerMessage(data: any) {
		//なにもしない
	}
	
	public sendAPIEvent(data: any) {
		if(this.client?.isBridgeSession(data.SessionId)) {
			return ;
		}
		
		console.log("sendAPIEvent-up");
		console.log(data);
		data.BridgeMarking = 1;
		let msg = JSON.stringify(data);
		this.client?.sendMessage(msg);
	}
};

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

	constructor(bc: any) {
		this.users = {};
		this.sessionDic = {};
		this.broadcast = bc;
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
		}
		break;
		
		case CMD.USERSTAT:
		{
			//ユーザステータスの更新
			console.log(data)
			this.broadcast(createMessage(data.UserId, CMD.USERSTAT, TARGET.SELF, data));
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
	
	public async cheerMessage(data: any) {
		let ret = null;
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
			let skipAICheck = true;
			let turn = -1;
			
			if(msg.Emotion != 0) skipAICheck = true;
			if(msg.Message.indexOf("【") != -1 && msg.Message.indexOf("】") != -1) {
				msg.Emotion = 0;
				skipAICheck = true;
			}
			if(msg.Message.indexOf("『") != -1 && msg.Message.indexOf("』") != -1) {
				msg.Emotion = 0;
				skipAICheck = true;
			}
			
			if(skipAICheck) {
				result = {
					Message: msg.Message,
					Emotion: msg.Emotion
				}
			} else {
				result = await checkMessageAndWrite(message);
			}
			
			if(result.Emotion === undefined) {
				result.Emotion = 0;
			}
			
			if(result.Message.indexOf("【") != -1 && result.Message.indexOf("】") != -1) {
				turn = 99;
			}
			if(result.Message.indexOf("『") != -1 && result.Message.indexOf("』") != -1) {
				turn = 20;
			}
			
			data.Data = result.result;
			this.broadcast(createMessage(to, CMD.CHEER, TARGET.SELF, data));
			
			//応援イベントをゲームに飛ばす
			let evtPacket = {
				Target: to,
				AvatarType: msg.Avatar,
				Name: msg.Name,
				Message: result.Message,
				Emotion: result.Emotion ? result.Emotion : 0,
				Turn: turn
			}
			let evtData = {
				EventId: 1001,
				FromId: from,
				Payload: this.createdPayload(evtPacket)
			};
			ret = createGameMessage(from, parseInt(data.GameId), CMD.EVENT, TARGET.SELF, evtData);
		}catch(ex){
			console.log(ex);
		}
		return ret;
	}
	
	async execQREvent(data: any) {
		
	}
	
	public sendAPIEvent(data: any) {
		switch(data.API) {
		case "createUser":
		case "gameStartAIGame":
		case "gameStartVC":
		case "gameEndAIGame":
		case "gameEndVC":
		}
	}
};
