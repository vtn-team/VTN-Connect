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
	SEND_JOIN = 100,
	SEND_EVENT = 101,
};


//接続するユーザを管理する構造体
export class UserSession {
	protected userId: string;			//ユーザ特定用のハッシュ
	protected client: WebSocket|null;	//WebSocket接続クライアント
	protected isPingAlive: boolean;		//生きているか
	
	//コンストラクタ
	constructor(userId: string, ws: WebSocket|null) {
		this.userId = userId;
		this.client = ws;
		this.isPingAlive = true;
	}
	
	protected setupExtends(us: UserSession) {
		this.userId = us.userId;
		this.client = us.client;
	}
	
	public term() {
		this.client?.terminate();
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
		console.log("ping:" + this.isPingAlive + "userId:" + this.userId);
		if (this.isPingAlive == false) this.term();

		this.client?.ping();
		this.isPingAlive = false;
	}
	public pong() {
		this.isPingAlive = true;
		console.log("pong:" + this.isPingAlive + "userId:" + this.userId);
	}
	
	public chkTarget(data: any) {
		let tgt: TARGET = data.Target;
		let senderId: string = data.UserId;
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
	
	public chkTarget(data: any) {
		let tgt: TARGET = data.Target;
		let senderId: string = data.UserId;
		switch(tgt) {
		case TARGET.ALL:return true;
		case TARGET.SELF: return (this.userId == senderId);
		case TARGET.OTHER: return (this.userId != senderId);
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

export function createGameMessage(senderId: string, senderGameId: string, command: CMD, target:TARGET, data: any) {
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