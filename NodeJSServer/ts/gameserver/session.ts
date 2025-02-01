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
	SEND_JOIN = 100,
	SEND_EVENT = 101,
	SEND_EPISODE = 102,
	SEND_USER_JOIN = 110,
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
		let senderId: string = data.UserId;
		switch(tgt) {
		case TARGET.ALL:return true;
		case TARGET.SELF: return (this.sessionId == senderId);
		case TARGET.OTHER: return (this.sessionId != senderId);
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
		let tgt: TARGET = data.Target;
		let senderId: string = data.UserId;
		switch(tgt) {
		case TARGET.ALL:return true;
		case TARGET.SELF: return (this.sessionId == senderId);
		case TARGET.OTHER: return (this.sessionId != senderId);
		}
	}
};

export function createMessage(senderId: string, command: CMD, target:TARGET, data: any) {
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

export function createGameMessage(senderId: string, senderGameId: number, command: CMD, target:TARGET, data: any) {
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