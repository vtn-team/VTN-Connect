import { GameConnect } from "./gamecon"
import { getElasticIP } from "./../elasticip"
import { WebSocket, WebSocketServer } from 'ws'
import { randomUUID } from 'crypto'
import { UserSession, CMD, TARGET, createMessage } from "./session"


//サーバキャッシュ
let gServer:Server|null = null;


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
			if(!us.chkTarget(data)) return;
			
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
			this.sessions[uuid] = new UserSession(uuid, ws);
			
			ws.on('pong', () => {
				this.pong(uuid);
			});

			ws.on('message', (message: string) => {
				console.log(' Received: %s', message);
				try
				{
					let data = JSON.parse(message);
					let sessionId = data["SessionId"];
					
					if(this.sessions[sessionId]) {
						//重要なメッセージはここでさばく
						switch(data["Command"])
						{
						case CMD.SEND_JOIN:
							this.joinRoom(data);
							break;
							
						default:
							this.contents.execMessage(data);
							break;
						}
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
	
	joinRoom(data: any) {
		let gameId = parseInt(data.GameId);
		let sessionId = data["SessionId"];
		
		this.sessions[sessionId] = this.contents.joinRoom(gameId, this.sessions[sessionId], data);
	}
	
	removeSession(uuid: string) {
		delete this.sessions[uuid];
		this.contents.removeSession(uuid);
		console.log("delete session :" + uuid);
	}

	pong(sessionId: string) {
		if (this.sessions[sessionId]) {
			this.sessions[sessionId].pong();
		}
	}

	public setupGameConnect() {
		this.contents.setupGameConnect();
	}
	
	public startRecord(gameId:number, gameHash: string) {
		this.contents.startRecord(gameId, gameHash);
	}
	
	public stopRecord(gameHash: string) {
		this.contents.stopRecord(gameHash);
	}
	
	public sendAPIEvent(data: any) {
		this.contents.sendAPIEvent(data);
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
	gServer.setupGameConnect();
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

//(公開関数)APIをイベントとして配信する
export function sendAPIEvent(data: any) {
	if(gServer == null) return;
	
	gServer.sendAPIEvent(data);
}

//(公開関数)ゲームを記録する
export function startRecord(gameId:number, gameHash:string) {
	if(gServer == null) return;
	
	gServer.startRecord(gameId, gameHash);
}

//(公開関数)ゲームの記録を終了する
export function stopRecord(gameHash:string) {
	if(gServer == null) return;
	
	gServer.stopRecord(gameHash);
}