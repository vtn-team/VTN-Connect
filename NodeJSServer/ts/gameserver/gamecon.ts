import { chat, chatWithSession } from "./../lib/chatgpt"
import { getMaster, getGameInfo, getGameEvent } from "./../lib/masterDataCache"
import { MessagePacket, checkMessageAndWrite, recordFriendShip } from "./../vclogic/vcmessage"
import { getGameSessions, updateArtifact, getArtifactEvent, ArtifaceEventStack, execArtifactAppearEvent } from "./../vclogic/vcgame"
import { stockEpisode } from "./../vclogic/vcgameInfo"
import { UserSession, VCGameSession, VCBridgeSession, CMD, TARGET, createMessage, createGameMessage, createdPayload, parsePayload } from "./session"
import { EventRecorder, EventPlayer } from "./eventrec"
import { GAME_SERVER_URI } from "../config/config"
import { WebSocket, WebSocketServer } from 'ws'

export enum SP_EVENT {
	AI_CHAT = 10000,
};

export interface GameConnectInterface {

	setupGameConnect() : void;

	joinGame(gameId: number, us: UserSession, data: any) : VCGameSession | null;
	execMessage(data: any) : void;
	removeSession(sessionId: string) : void;
	getActiveGames() : any;
	
	startRecord(gameId:number, gameHash: string) : void;
	stopRecord(gameHash: string) : void;
	sendAPIEvent(data: any) : void;
}

export class GameConnectBridge {
	protected ws: WebSocket|null;
	protected client: VCBridgeSession|null;
	protected msgSender: any;
	protected apiSender: any;
	protected games:any;
	protected sessionId: string;
	
	constructor(msgSender: any, apiSender: any) {
		this.ws = null;
		this.client = null;
		this.sessionId = "";
		this.games = [];
		this.msgSender = msgSender;
		this.apiSender = apiSender;
		this.setup();
	}
	
	async setup() {
		const res = await fetch(`${GAME_SERVER_URI}/vc/getaddr`, {method: 'GET'});
		const result = await res.json();
		
		let ws = new WebSocket(result.Address);
		ws.on('error', console.error);
		ws.on('open', function open() {
			//ws.send('something');
		});
		ws.on('message', (message:string) => {
			console.log(message.toString());
			try {
				let data = JSON.parse(message.toString());
				
				if(data.API) {
					this.apiSender(data);
					return;
				}
				
				if(data.Data) {
					data.Data = JSON.parse(data.Data);
				}
				
				data.BridgeMarking = 1;
				
				//重要なメッセージはここでさばく
				switch(data["Command"])
				{
				case CMD.WELCOME:
				{
					this.sessionId = data.Data.SessionId;
					//SessionIdをキーにしてJoinを返す
					let json = {
						SessionId: data.Data.SessionId,
						Command: CMD.SEND_JOIN,
						GameId: 99,
					};
					ws.send( JSON.stringify(json) );
					let us = new UserSession(data.Data.SessionId, ws);
					this.client = new VCBridgeSession(us);
					return ;
				}
				break;
				
				case CMD.GAMESTAT:
					console.log(data.Data.ActiveGames)
					this.games = data.Data.ActiveGames;
					return;
				}
				
				this.msgSender(data);
			}catch(ex){
				console.log(ex);
			}
		});
	}
	
	public setupGameConnect() {
		
	}

	public execMessage(data: any) {
		if(data.BridgeMarking) {
			delete data.BridgeMarking;
			return ;
		}
		
		console.log("execMessage");
		console.log(data);
		data.SessionId = this.sessionId;
		let msg = JSON.stringify(data);
		this.client?.sendMessage(msg);
	}

	public joinGame(gameId: number, us: UserSession, data: any) {
		//ここにきてはいけない
		console.log("bad case join");
		return null;
	}
	
	public removeSession(sessionId: string) {
		//ここにきてはいけない
		console.log("bad case leave");
	}
	
	public getActiveGames() {
		return this.games;
	}
	
	public sendAPIEvent(data: any) {
		if(data.BridgeMarking) {
			delete data.BridgeMarking;
			return ;
		}
		
		//ここにきてはいけない
		console.log("sendAPIEvent");
		console.log(data);
		data.SessionId = this.sessionId;
		let msg = JSON.stringify(data);
		this.client?.sendMessage(msg);
	}
	
	public startRecord(gameId:number, gameHash: string) {
		//ここにきてはいけない
		console.log("bad case record");
	}
	
	public stopRecord(gameHash: string) {
		//ここにきてはいけない
		console.log("bad case record");
	}
};

class GameContainer {
	protected gameId: number;
	protected recorder: EventRecorder|null;  //イベントレコーダー
	protected player: EventPlayer|null;  //イベントプレーヤー
	protected gameInfo: any;
	protected queue: Array<any>;
	protected session: VCGameSession|null;
	protected versionCode: string;
	protected buildHash: string;
	
	constructor(gameInfo: any, session: VCGameSession|null, joinData: any) {
		this.gameInfo = gameInfo;
		this.gameId = gameInfo.Id;
		this.session = session;
		this.recorder = null;
		this.player = null;
		if(session == null) {
			this.player = new EventPlayer(this.gameId);
		}
		this.queue = [];
		this.versionCode = joinData.Version;
		this.buildHash = joinData.BuildHash;
	}

	public isActiveSession() {
		return this.session != null;
	}
	
	public getStat() {
		if(!this.session) {
			return {
				GameId: this.gameId,
				Title: this.gameInfo.GameTitle,
				ActiveTime: 0,
				Version: this.versionCode,
				Build: this.buildHash
			};
		}
		
		return {
			GameId: this.gameId,
			Title: this.gameInfo.GameTitle,
			ActiveTime: this.session.getActiveTime(),
			Version: this.versionCode,
			Build: this.buildHash
		};
	}

	public startReplay(msgExec: any) {
		if (!this.player) return;

		this.player.start(msgExec);
	}
	
	public stopReplay() {
		if(!this.player) return;
		
		this.player.stop();
	}
	
	public startRecord(gameHash: string) {
		this.recorder = new EventRecorder(this.gameId, gameHash);
		console.log("start record");
	}
	
	public recordMessage(gameId: number, data: any) {
		if(!this.recorder) return;

		console.log("record event");
		delete data["SessionId"];
		this.recorder.recordMessage(gameId, data);
	}

	public stopRecord(gameHash: string) {
		this.recorder?.save(gameHash);
		console.log("save record");
	}

	public term() {
		if (this.player) this.player.stop();
	}

	public sendEventMessage(msg: any) {
		let evtJson = JSON.stringify(msg)
		this.session?.sendMessage(evtJson);
	}
}


//ゲームコネクト
//NOTE: ゲーム同士でイベントのやり取りをするサービス
export class GameConnect {
	games: any;
	sessionDic: any;
	gameSessions: any;
	broadcast: any;
	recordingHash: any;

	constructor(bc: any) {
		this.games = {};
		this.sessionDic = {};
		this.recordingHash = {};
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

	castEvent(gameId: number, data: any) {
		let evtId = parseInt(data.EventId);
		let event = getGameEvent(evtId);
		if (!event) {
			console.log("NO DATA:" + data.EventId);
			return;
		}
		
		//console.log(event)

		let msg = createGameMessage(data.UserId, gameId, CMD.EVENT, TARGET.SELF, data);
		for (var gId in this.games) {
			if (!this.games[gId].isActiveSession()) continue;
			
			if (event.Target == -1) {
				this.games[gId].sendEventMessage(msg);
			} else if (gId == event.Target) {
				this.games[gId].sendEventMessage(msg);
			}
		}
	}

	public setupGameConnect() {
		let master = getMaster("GameInfo");
		for (let m of master) {
			if (m.IsReplayTarget && !this.games[m.Id]) {
				this.games[m.Id] = new GameContainer(m, null, { Version: "0.1.0", BuildHash: "BOT" });
				this.games[m.Id].startReplay((gameId: number, data: any) => { this.execReplay(gameId, data); } );
			}
		}
	}

	public execReplay(gameId: number, data: any) {
		let usePortal = false;
		usePortal = this.execCommand(data);
		data.SessionId = "BOT";
		this.castEvent(gameId, data);
	}

	public execMessage(data: any) {
		let usePortal = false;
		if(!data["Command"]) return;
		
		let payload = parsePayload(data["Payload"]);
		let gameId = this.sessionDic[data.SessionId];
		
		//portal対応
		if(gameId == 99) {
			this.broadcast(data);
			return;
		}
		
		console.log(gameId);
		console.log(data);
		
		switch(data["Command"])
		{
		case CMD.SEND_EVENT:
		{
			if(this.games[gameId]) {
				this.games[gameId].recordMessage(gameId, data);
				data = this.execCommand(data);
				this.castEvent(gameId, data);
			}else{
				console.log("not found game:" + gameId);
				data = this.execCommand(data);
				this.castEvent(data.GameId, data);
			}
		}
		break;
		
		case CMD.SEND_EPISODE:
		{
			if(!data["GameHash"]) break;
			
			stockEpisode(data["GameHash"], data["UserId"], data);
			
			if(data.EpisodeCode == 200) {
				//冒険者が会話をしたらアーティファクトカウントを追加
				execArtifactAppearEvent(ArtifaceEventStack.TALK);
				
				//フレンドログにも追加
				let tgtId = 0;
				let name = "Unknown"
				for(let p of data.Payload) {
					if(p.Description == "TargetId") {
						tgtId = parseInt(p.Data);
					}
					
					if(p.Description == "会話した相手") {
						name = p.Data;
					}
				}
				recordFriendShip(200, data.UserId, tgtId, name);
			}
		}
		break;
		
		case CMD.SEND_CHEER:
		{
			//応援メッセージが来たらアーティファクトカウントを追加
			execArtifactAppearEvent(ArtifaceEventStack.CHEER);
			
			//フレンド記録
			//if(data.ToUserId > 999) {
				recordFriendShip(1001, data.ToUserId, data.FromUserId, data.Data.Name, { Message: data.Data.Message });
			//}
		}
		break;
		
		case CMD.SEND_QR_EVENT:
		{
			//QR読み込みでアーティファクトカウントを追加
			execArtifactAppearEvent(ArtifaceEventStack.QRCODE, payload.QRTargetId);
		}
		break;
		}
		
		return usePortal;
	}

	public joinGame(gameId: number, us: UserSession, data: any) {
		if(this.games[gameId]) {
			
		}
		
		if(gameId === 0) {
			console.log(`GAME ID:0 reject.`);
			return null;
		}
		
		let find = false;
		let master = getGameInfo(gameId);
		if(master) {
			let session = new VCGameSession(gameId, us);
			if (this.games[gameId]) {
				this.games[gameId].term();
			}
			this.games[gameId] = new GameContainer(master, session, data);
			this.sessionDic[data.SessionId] = gameId;
			console.log(`GAME ID:${gameId} - ${master.ProjectCode} join.`);
			
			return session;
		}else{
			console.log(`GAME ID:${gameId} not found.`);
		}
		return null;
	}
	
	public removeSession(sessionId: string) {
		if(!this.sessionDic[sessionId]) {
			return;
		}
		
		let gameId = this.sessionDic[sessionId];
		delete this.games[gameId];
		delete this.sessionDic[sessionId];

		//イベントプレイヤーにする
		//this.setupGameConnect();
		
		console.log(`GAME ID:${gameId} leave.`);
	}
	
	public getActiveGames() {
		let games:any = [];
		this.gameSessions = getGameSessions();
		for(var gId in this.games) {
			let stat = this.games[gId].getStat();
			if(this.gameSessions[gId]) {
				stat.Session = this.gameSessions[gId];
				//プレイ中のゲームの情報を送信する
			}
			games.push(stat);
		}
		
		return games;
	}
	
	//処理
	execCommand(data: any) {
		let evtId = parseInt(data.EventId);
		let event = getGameEvent(evtId);
		let payload:any = [];
		
		//200以下のゲームは送信者の情報を記録する
		if(evtId < 200) {
			payload = parsePayload(data.Payload);
			let game = getGameInfo(data.FromId);
			let session = this.gameSessions[data.FromId];
			let dd:any = {
				"GameName" : game.GameTitle,
				"UserId" : session?.UserId,
				"Name" : session?.UserInfo?.Name
			};
			if(!dd.Name) dd.Name = "Unknown";
			
			let addPayload = createdPayload(dd);
			
			for(let d of addPayload) {
				data.Payload.push(d);
			}
		}
		
		//イベント別に情報を整理
		switch(evtId)
		{
		
		//アーティファクト取得
		case 1200:
			payload = parsePayload(data.Payload);
			updateArtifact(payload.UserId);
			break;
		}
		
		//console.log(data);
		return data;
	}
	
	public startRecord(gameId:number, gameHash: string) {
		if(!this.games[gameId]) return;
		
		this.games[gameId].startRecord(gameHash);
		this.recordingHash[gameHash] = gameId;
	}
	
	public stopRecord(gameHash: string) {
		if(!this.recordingHash[gameHash]) return;
		
		let gameId = this.recordingHash[gameHash];
		this.games[gameId].stopRecord(gameHash);
	}
	
	public sendAPIEvent(data: any) {
		
		switch(data.API) {
		case "createUser":
		case "gameStartAIGame":
			{
				//アーティファクトが出ていたらアーティファクト送信
				let atEvent = getArtifactEvent();
				if(atEvent > 0) {
					setTimeout(() => {
						this.execMessage({
							UserId: 0,
							GameId: 0,
							Command: CMD.SEND_EVENT,
							EventId: 1100 + atEvent - 1,
							FromId: 0,
							Payload: []
						});
					}, 1000);
				}
				
				this.execMessage({
					UserId: 0,
					GameId: 0,
					Command: CMD.SEND_EVENT,
					EventId: 1006,
					FromId: 0,
					Payload: createdPayload({
						"GameId": data.GameId,
						"API" : data.API
					})
				});
			}
			break;
			
		case "gameStartVC":
			{
				//ゲームを遊んだらアーティファクトカウントを追加
				execArtifactAppearEvent(ArtifaceEventStack.PLAYGAME);
			}
			break;
			
		case "gameEndAIGame":
		case "gameEndVC":
		}
	}
};
