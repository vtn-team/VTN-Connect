import { chat, chatWithSession } from "./../lib/chatgpt"
import { getMaster, getGameInfo, getGameEvent } from "./../lib/masterDataCache"
import { MessagePacket, checkMessageAndWrite } from "./../vclogic/vcmessage"
import { stockEpisode } from "./../vclogic/vcgameinfo"
import { UserSession, VCGameSession, CMD, TARGET, createMessage, createGameMessage } from "./session"
import { EventRecorder, EventPlayer } from "./eventrec"


export enum SP_EVENT {
	AI_CHAT = 10000,
};

class GameContainer {
	protected gameId: number;
	protected recorder: EventRecorder|null;  //イベントレコーダー
	protected player: EventPlayer|null;  //イベントプレーヤー
	protected gameInfo: any;
	protected queue: Array<any>;
	protected session: VCGameSession|null;
	
	constructor(gameInfo: any, session: VCGameSession|null) {
		this.gameInfo = gameInfo;
		this.gameId = gameInfo.Id;
		this.session = session;
		this.recorder = null;
		this.player = null;
		if(session == null) {
			this.player = new EventPlayer(this.gameId);
		}
		this.queue = [];
	}

	public isActiveSession() {
		return this.session != null;
	}
	
	public getStat() {
		if(!this.session) return null;
		
		return {
			GameId: this.gameId,
			Name: this.gameInfo.ProjectCode,
			ActiveTime: this.session.getActiveTime()
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
	}
	
	public recordMessage(gameId: number, data: any) {
		if(!this.recorder) return;

		delete data["SessionId"];
		this.recorder.recordMessage(gameId, data);
	}

	public stopRecord(gameHash: string) {
		this.recorder?.save(gameHash);
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

		let msg = createGameMessage(data.SessionId, gameId, CMD.EVENT, TARGET.SELF, data);
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
				this.games[m.Id] = new GameContainer(m, null);
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
		let payload = this.parsePayload(data["Payload"]);
		let gameId = this.sessionDic[data.SessionId];
		
		switch(data["Command"])
		{
		case CMD.SEND_EVENT:
		{
			switch(data.EventId)
			{
			case SP_EVENT.AI_CHAT:
			{
				let data = payload.data;
				let result = chatWithSession(data.ThreadId, data.Prompt);
				return;
			}
			
			case 100:
			{
				this.messageRelay(data);
				return;
			}
			break;
			}

			this.games[gameId].recordMessage(gameId, data);

			usePortal = this.execCommand(data);
			this.castEvent(gameId, data);
		}
		break;
		
		case CMD.SEND_EPISODE:
		{
			if(!data["GameHash"]) break;
			
			stockEpisode(data["GameHash"], data);
		}
		break;
		}
		
		return usePortal;
	}

	joinGame(gameId: number, us: UserSession, data: any) {
		if(this.games[gameId]) {
			
		}
		
		if(gameId === 0) {
			console.log(`GAME ID:0 reject.`);
			return ;
		}
		
		let find = false;
		let master = getGameInfo(gameId);
		if(master) {
			let session = new VCGameSession(gameId, us);
			if (this.games[gameId]) {
				this.games[gameId].term();
			}
			this.games[gameId] = new GameContainer(master, session);
			this.sessionDic[data.SessionId] = gameId;
			console.log(`GAME ID:${gameId} - ${master.ProjectCode} join.`);
			
			return session;
		}else{
			console.log(`GAME ID:${gameId} not found.`);
		}
	}
	
	public removeSession(sessionId: string) {
		if(!this.sessionDic[sessionId]) {
			return;
		}
		
		let gameId = this.sessionDic[sessionId];
		delete this.games[gameId];
		delete this.sessionDic[sessionId];

		//イベントプレイヤーにする
		this.setupGameConnect();
		
		console.log(`GAME ID:${gameId} leave.`);
	}
	
	public getActiveGames() {
		let games:any = [];
		
		for(var gId in this.games) {
			let stat = this.games[gId].getStat();
			if(stat){
				games.push(stat);
			}
		}
		
		return games;
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
		//TBD
	}
};
