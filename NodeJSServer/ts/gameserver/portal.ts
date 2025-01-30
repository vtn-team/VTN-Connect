import { chat, chatWithSession } from "./../lib/chatgpt"
import { getMaster, getGameInfo, getGameEvent } from "./../lib/masterDataCache"
import { MessagePacket, checkMessageAndWrite } from "./../vclogic/vcmessage"
import { getUserFromId, getUserFromHash } from "./../vclogic/vcuser"
import { UserSession, VCUserSession, CMD, TARGET, createMessage, createGameMessage } from "./session"
import { EventRecorder, EventPlayer } from "./eventrec"


export interface VCActiveUser
{
	UserId: number;
	DisplayName: string;
	ActiveTime: number;
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
		//TBD
	}

	public setupSakuraConnect() {
		//TBD
	}

	public execMessage(data: any) {
		let usePortal = false;
		let payload = this.parsePayload(data["Payload"]);
		let userId = this.sessionDic[data.SessionId];
		
		switch(data["Command"])
		{
		case CMD.SEND_EVENT:
		{
			usePortal = this.execCommand(data);
			this.broadcast(createMessage(data.UserId, CMD.EVENT, TARGET.ALL, data));
		}
		break;
		}
		return usePortal;
	}

	async joinRoom(userId: number, us: UserSession, data: any) {
		if(userId === 0) {
			console.log(`GAME ID:0 reject.`);
			return ;
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
	
	async messageRelay(data: any) {
		try {
			let json = JSON.parse(data.Data);
			let to = json.ToUserId;
			let from = json.FromUserId;
			if(!to) {
				to = -1;
			}
			if(!from) {
				from = -1;
			}
			
			let message = {
				ToUserId: to,
				FromUserId: from,
				Name: json.Name,
				Message: json.Message
			}
			
			let result = await checkMessageAndWrite(message);
			data.Data = result.result;
			this.broadcast(createMessage(from, CMD.EVENT, TARGET.ALL, data));
		}catch(ex){
			console.log(ex);
		}
	}
	
	public sendAPIEvent(data: any) {
		//TBD
	}
};
