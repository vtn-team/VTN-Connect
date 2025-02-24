import { GameConnect, GameConnectBridge, GameConnectInterface } from "./gamecon"
import { UserPortal, UserPortalBridge, UserPortalInterface } from "./portal"
import { QREventer } from "./qrevents"
import { getElasticIP } from "./../elasticip"
import { WebSocket, WebSocketServer } from 'ws'
import { randomUUID } from 'crypto'
import { UserSession, VCBridgeSession, CMD, TARGET, createMessage } from "./session"
import { SakuraConnect } from "./sakuracon"


//サーバキャッシュ
let gServer:Server|null = null;

//Export
//分離
export enum ServerType {
	Both,
	GameConnect,
	UserPortal,
}


//サーバ本体
//NOTE: ここは特にいじる必要はない部分
//NOTE: 必要なコンテンツを増やす時はここから増やす
class Server {
	protected serverType: ServerType;	//サーバータイプ
	protected sessions: any;			//各接続のセッション
	protected server: any;				//WebSocketサーバ本体
	protected roomCheck: any;			//ルーム監視用のタイマー
	protected sendStatsTimer:any;		//スタッツ送信用タイマー
	
	//どちらかしか起動しない
	protected contents: GameConnectInterface;	//ゲームコネクター(ゲーム同士をつなげるGameServerの本体)
	protected portal: UserPortalInterface;		//ユーザールーム(ユーザを管理するGameServerの本体)
	
	protected sakura: SakuraConnect|null;	//サクラ
	protected qrEventer: QREventer|null;	//QR
	protected lastActiveNum: number;	//現在のアクティブ人数キャッシュ
	protected port: number;				//接続するポート
	protected isMaintenance: boolean;	//メンテナンス情報
	

	//データ送信
	broadcast(data: any) {
		let msg = JSON.stringify(data);
		
		this.messagelog(msg, data);
		
		//let msg = msgpack.pack(data);
		for(var k in this.sessions) {
			let us = this.sessions[k];
			if(!us.chkTarget(data)) {
				//console.log("はじかれた:");
				//console.log(data);
				continue;
			}
			
			us.sendMessage(msg);
		}
	};
	
	//コンストラクタ
	constructor(mode:ServerType, port: number) {
		this.sessions = {};
		this.serverType = mode;
		this.port = port;
		this.isMaintenance = false;
		this.server = new WebSocketServer({ port });
		this.qrEventer = null;
		this.sakura = null;
		
		let createOptions = true;
		switch(mode) {
		default:
		case ServerType.Both:
			this.contents = new GameConnect((data: any)=>{ this.broadcast(data); });
			this.portal = new UserPortal((data: any)=>{ this.broadcast(data); });
			console.log("server content is both type.");
			break;
			
		case ServerType.GameConnect:
			this.contents = new GameConnect((data: any)=>{ this.broadcast(data); });
			this.portal = new UserPortalBridge(null);
			console.log("server content is gameconnect only.");
			createOptions = false;
			break;
			
		case ServerType.UserPortal:
			this.contents = new GameConnectBridge((data: any)=>{ this.message(data); }, (data: any) => { this.sakura?.apiHook(data); this.portal.sendAPIEvent(data); });
			this.portal = new UserPortal((data: any)=>{ this.broadcast(data); });
			console.log("server content is userportal only.");
			break;
		}
		
		if(createOptions) {
			this.qrEventer = new QREventer();
			this.sakura = new SakuraConnect((message: any) => {
				this.cheer(message);
			});
		}
		
		this.lastActiveNum = 0;
		this.server.on ('connection', (ws: any) => {
			let uuid = randomUUID();
			this.sessions[uuid] = new UserSession(uuid, ws);
			
			ws.on('pong', () => {
				this.pong(uuid);
			});

			ws.on('message', async (message: string) => {
				console.log(' Received: %s', message);
				try
				{
					let data = JSON.parse(message);
					let sessionId = data["SessionId"];
					
					if(this.isMaintenance) return;
					
					if(this.sessions[sessionId]) {
						await this.message(data);
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
			let echoback = createMessage(-1, CMD.WELCOME, TARGET.SELF, { SessionId: uuid });
			let payload = JSON.stringify(echoback);
			ws.send(payload);
		});
		
		this.server.on('close', () => {
			clearInterval(this.roomCheck);
		});
		
		this.roomCheck = setInterval(() => {
			this.activeCheck();
		}, 10000);
		
		this.sendStatsTimer = setInterval(() => {
			this.sendGameStatus();
		}, 5000);
		
		console.log("server launch port on :" + port);
	}
	
	async message(data: any) {
		//重要なメッセージはここでさばく
		switch(data["Command"])
		{
		case CMD.SEND_JOIN:
			this.joinGame(data);
			break;
			
		case CMD.SEND_USER_JOIN:
			this.joinPortal(data);
			break;
			
		case CMD.SEND_EVENT:
			//イベントフック用
			this.sakura?.eventHook(data.EventId, data);
			
		default:
			this.contents.execMessage(data);
			this.portal.execMessage(data);
			break;
			
		case CMD.SEND_CHEER:
			{
				this.cheer(data);
			}
			break;
			
		case CMD.SEND_QR:
			{
				if(!this.qrEventer)
					break;
				
				let result:any = await this.qrEventer.execEvent(data);
				if(result.Status == 1) {
					this.contents.execMessage(result.Data);
				}
				this.portal.execMessage(result.Message);
			}
			break;
		}
	}
	
	async cheer(data: any) {
		let packet:any = await this.portal.cheerMessage(data);
		if(packet) {
			this.contents.execMessage(packet);
		}
	}
	
	joinGame(data: any) {
		let sessionId = data["SessionId"];
		let gameId = parseInt(data.GameId);
		
		this.sessions[sessionId] = this.contents.joinGame(gameId, this.sessions[sessionId], data);
		
		//UserPortalだけ例外
		if(gameId == 99) {
			this.sessions[sessionId] = new VCBridgeSession(this.sessions[sessionId]);
			this.portal = new UserPortalBridge(this.sessions[sessionId] );
		}
	}
	
	async joinPortal(data: any) {
		let sessionId = data["SessionId"];
		let userId = parseInt(data.UserId);
		
		let session = await this.portal.joinRoom(userId, this.sessions[sessionId], data);
		if(session) {
			this.sessions[sessionId] = session;
		}else{
			this.removeSession(sessionId);
			console.log("見つからないユーザでjoinしました");
		}
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
	
	activeCheck() {
		let count = 0;
		for(var k in this.sessions) {
			let us = this.sessions[k];
			if (!us.isAlive()) return us.term();

			us.ping();
			count++;
		}
		this.lastActiveNum = count;
		//console.log("active session count:" + count);
	}
	
	sendGameStatus() {
		let stats = {
			IsMaintenance: this.isMaintenance,
			ActiveGames: this.contents.getActiveGames(),
			//ActiveUsers: this.portal.getActiveUsers()
		}
		this.broadcast(createMessage(-1, CMD.GAMESTAT, TARGET.ALL, stats));
	}
	
	messagelog(msg: string, data: any) {
		if(data.Command == CMD.GAMESTAT) return;
		
		console.log("send:" + msg);
	}

	public setupGameConnect() {
		this.contents.setupGameConnect();
	}
	
	public updateMaintenance(isMaintenance: boolean) {
		this.isMaintenance = isMaintenance;
	}
	
	public startRecord(gameId:number, gameHash: string) {
		this.contents.startRecord(gameId, gameHash);
	}
	
	public stopRecord(gameHash: string) {
		this.contents.stopRecord(gameHash);
	}
	
	public sendAPIEvent(data: any) {
		this.contents.sendAPIEvent(data);
		this.portal.sendAPIEvent(data);
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
export function launchDGS(mode: ServerType, port: number) {
	if(gServer != null) return;
	
	gServer = new Server(mode, port);
	//gServer.setupGameConnect();
}

//(公開関数)アクティブなゲーム数を返す
export function updateMaintenance(isMaintenance: boolean) {
	if(gServer == null) return 0;
	
	return gServer.updateMaintenance(isMaintenance);
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