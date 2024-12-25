import { GameConnect, CMD, TARGET, createMessage } from "./contents"
import { getElasticIP } from "./../elasticip"
import { WebSocket, WebSocketServer } from 'ws'
import { randomUUID } from 'crypto'


//サーバキャッシュ
let gServer:Server|null = null;


//接続するユーザを管理する構造体
class UserSession {
	protected userId: string;		//ユーザ特定用のハッシュ
	protected client: WebSocket;	//WebSocket接続クライアント
	protected isPingAlive: boolean;	//生きているか
	
	//コンストラクタ
	constructor(userId: string, ws: WebSocket) {
		this.userId = userId;
		this.client = ws;
		this.isPingAlive = true;
	}
	
	public term() {
		this.client.terminate();
	}
	
	public sendMessage(msg: string) {
		if (this.client == null) return 
		if (this.client.readyState != WebSocket.OPEN) return;
		
		this.client.send(msg);
	}
	
	public isAlive() : boolean {
		return this.client.readyState == WebSocket.OPEN;
	}
	
	public ping() {
		if(this.isPingAlive == false) this.term();
		this.client.ping();
		this.isPingAlive = false;
	}
	public pong() {
		this.isPingAlive = true;
	}
	
	public chkTarget(tgt: TARGET, tgtId: string) {
		switch(tgt) {
		case TARGET.ALL:return true;
		case TARGET.SELF: return (this.userId == tgtId);
		case TARGET.OTHER: return (this.userId != tgtId);
		}
	}
};


//サーバ本体
//NOTE: ここは特にいじる必要はない部分
//NOTE: 必要なコンテンツを増やす時はここから増やす
class Server {
	
	protected sessions: any;			//各接続のセッション
	protected server: any;				//WebSocketサーバ本体
	protected roomCheck: any;			//ルーム監視用のタイマー
	protected contents: GameConnect;	//ゲームコネクター(ゲーム同士をつなげるGameServerの本体)
	protected lastActiveNum: number;	//現在のアクティブ人数キャッシュ
	protected port: number;				//接続するポート

	//データ送信
	broadcast(data: any) {
		let msg = JSON.stringify(data);
		//let msg = msgpack.pack(data);
		for(var k in this.sessions) {
			let us = this.sessions[k];
			if(!us.chkTarget(data.Target, data.UserId)) return;
			
			us.sendMessage(msg);
			console.log("send:" + msg);
		}
	};
	
	//コンストラクタ
	constructor(port: number) {
		this.sessions = {};
		this.port = port;
		this.server = new WebSocketServer({ port });
		this.contents = new GameConnect((data: any)=>{ this.broadcast(data); });
		this.lastActiveNum = 0;
		this.server.on ('connection', (ws: any) => {
			let uuid = randomUUID();
			let session = new UserSession(uuid, ws);
			this.sessions[uuid] = session;
			
			ws.on('pong', () => {
				session.pong();
			});

			ws.on('message', (message: string) => {
				console.log(' Received: %s', message);
				try
				{
					let data = JSON.parse(message);
					let sessionId = data["SessionId"];
					
					if(this.sessions[sessionId]) {
						this.contents.execMessage(data);
					}else{
						console.error("session not found.")
					}
				}
				catch(ex)
				{
					console.error(ex);
				}
			});

			ws.on('close', (code:number, reason: any)=> {
				//console.log(reason.toString());
				//console.log("ws connection closed.");
				this.removeSession(uuid);
			});

			//Joinをもらうためのエコーバック
			let echoback = createMessage("None", CMD.WELCOME, TARGET.SELF, { SessionId: uuid });
			let payload = JSON.stringify(echoback);
			ws.send(payload);
		});
		
		this.server.on('close', () => {
			clearInterval(this.roomCheck);
		});
		
		this.roomCheck = setInterval(() => {
			let count = 0;
			for(var k in this.sessions) {
				let us = this.sessions[k];
				if (!us.isAlive()) return us.term();
				
				us.ping();
				count++;
			}
			this.lastActiveNum = count;
			//console.log("active session count:" + count);
		}, 10000);
		
		console.log("server launch port on :" + port);
	}
	
	removeSession(uuid: string) {
		delete this.sessions[uuid];
		this.contents.removeSession(uuid);
		console.log("delete session :" + uuid);
	}
	
	public getPort() {
		return this.port;
	}
	
	//アクティブ人数を返す
	public getActiveSessionNum() {
		return this.lastActiveNum;
	}
	
	//アクティブなゲーム数を返す
	public getActiveGames() {
		return this.contents.getActiveGames();
	}
}




//(公開関数)サーバを起動する
export function launchDGS(port: number) {
	if(gServer != null) return;
	
	gServer = new Server(port);
}

//(公開関数)WebSocketに接続するホストアドレスとポートを返す
export function getConnectionAddress() {
	if(gServer == null) return null;
	
	return { host: getElasticIP(), port: gServer.getPort() };
}

//(公開関数)接続中のユーザ数を返す
export function getActiveSessionNum() {
	if(gServer == null) return 0;
	
	return gServer.getActiveSessionNum();
}

//(公開関数)アクティブなゲーム数を返す
export function getActiveGames() {
	if(gServer == null) return 0;
	
	return gServer.getActiveGames();
}
