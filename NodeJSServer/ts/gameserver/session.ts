import { WebSocket } from 'ws'

export enum TARGET {
	ALL = 0,
	SELF = 1,
	OTHER = 2,	//TargetSessionIdsが渡される
};

export enum CMD {
	WELCOME = 1,
	JOIN = 2,
	EVENT = 3,
	GAMESTAT = 4,
	CHEER = 5,
	USERSTAT = 6,
	SEND_JOIN = 100,
	SEND_EVENT = 101,
	SEND_EPISODE = 102,
	SEND_CHEER = 103,
	SEND_QR = 104,
	SEND_USER_JOIN = 110,
	ERROR = 500,
};

export enum SESSION_TYPE {
	INVALID = 0,
	USER = 1,
	GAME = 2,
}

export interface VCActiveGame
{
	GameId: number;
	Name: string;
	ActiveTime: number;
}


//接続するユーザを管理する構造体
export class UserSession {
	protected sessionId: string;		//ユーザ特定用のハッシュ
	protected client: WebSocket|null;	//WebSocket接続クライアント
	protected isPingAlive: boolean;		//生きているか
	protected bornAt: Date;
	
	//コンストラクタ
	constructor(sessionId: string, ws: WebSocket|null) {
		this.sessionId = sessionId;
		this.client = ws;
		this.bornAt = new Date();
		this.isPingAlive = true;
	}
	
	protected setupExtends(us: UserSession) {
		this.sessionId = us.sessionId;
		this.client = us.client;
	}
	
	public term() {
		this.client?.terminate();
	}
	
	public getActiveTime() {
		return new Date().valueOf() - this.bornAt.valueOf();
	}
	
	public getSessionType() {
		return SESSION_TYPE.INVALID;
	}
	
	public sendMessage(msg: string) {
		if (this.client == null) return 
		if (this.client.readyState != WebSocket.OPEN) return;
		
		this.client?.send(msg);
	}
	
	public isAlive() : boolean {
		return this.client?.readyState == WebSocket.OPEN;
	}
	
	public ping() {
		if (this.isPingAlive == false) this.term();

		this.client?.ping();
		this.isPingAlive = false;
	}
	public pong() {
		this.isPingAlive = true;
	}
	
	public chkTarget(data: any) {
		let tgt: TARGET = data.Target;
		let senderId: string = data.UserId;
		switch(tgt) {
		case TARGET.ALL:return true;
		case TARGET.SELF: return (this.sessionId == senderId);
		case TARGET.OTHER: return (this.sessionId != senderId);
		}
	}
};

//ユーザーセッション
export class VCUserSession extends UserSession {
	protected userId: number;		//ゲーム特定用Id
	
	//コンストラクタ
	constructor(userId: number, us: UserSession) {
		super("", null);
		this.setupExtends(us);
		this.userId = userId;
	}
	
	public getSessionType() {
		return SESSION_TYPE.USER;
	}
	
	public chkTarget(data: any) {
		let tgt: TARGET = data.Target;
		let senderId: number = data.UserId;
		switch(tgt) {
		case TARGET.ALL:return true;
		case TARGET.SELF: return (this.userId == senderId);
		case TARGET.OTHER: return (this.userId != senderId);
		}
	}
};

//ゲームセッション
export class VCGameSession extends UserSession {
	protected gameId: number;		//ゲーム特定用Id
	
	//コンストラクタ
	constructor(gameId: number, us: UserSession) {
		super("", null);
		this.setupExtends(us);
		this.gameId = gameId;
	}
	
	public getSessionType() {
		return SESSION_TYPE.GAME;
	}
	
	public chkTarget(data: any) {
		if(data.GameId === undefined) return false;
		
		let tgt: TARGET = data.Target;
		let senderId: number = data.GameId;
		switch(tgt) {
		case TARGET.ALL:return true;
		case TARGET.SELF: return (this.gameId == senderId);
		case TARGET.OTHER: return (this.gameId != senderId);
		}
	}
};

export function createMessage(senderId: number, command: CMD, target:TARGET, data: any) {
	//let msg = msgpack.pack(data);
	delete data["Command"]
	let msg = JSON.stringify(data);
	let ret = { 
		"UserId" : senderId,
		"Target" : target,
		"Command" : command,
		"Data" :msg
	};
	return ret;
}

export function createGameMessage(senderId: number, senderGameId: number, command: CMD, target:TARGET, data: any) {
	//let msg = msgpack.pack(data);
	delete data["Command"]
	let msg = JSON.stringify(data);
	let ret = { 
		"UserId" : senderId,
		"GameId" : senderGameId,
		"Target" : target,
		"Command" : command,
		"Data" :msg
	};
	return ret;
}

export function parsePayload(payload: any) {
	let data:any = {};
	if(payload) {
		for(var d of payload) {
			switch(d.TypeName)
			{
			case "Integer":
			case "number":
			case "Int32":
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
	return data;
}

export function createdPayload(data: any) {
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