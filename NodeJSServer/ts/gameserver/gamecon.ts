import { chat, chatWithSession } from "./../lib/chatgpt"
import { getGameInfo, getGameEvent } from "./../lib/masterDataCache"
import { MessagePacket, checkMessageAndWrite } from "./../vclogic/vcmessage"



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

export enum SP_EVENT {
	AI_CHAT = 10000,
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


class GameContainer {
	protected gameId: number;
	protected master: any;
	protected queue: Array<any>;
	
	constructor(master: any) {
		this.master = master;
		this.gameId = master.Id;
		this.queue = [];
	}
}


//ゲームコネクト
//NOTE: ゲーム同士でイベントのやり取りをするサービス
export class GameConnect {
	games: any;
	sessionDic: any;
	broadcast: any;

	constructor(bc: any) {
		this.games = {};
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

	public execMessage(data: any) {
		let payload = this.parsePayload(data["Payload"]);
		
		switch(data["Command"])
		{
		case CMD.SEND_JOIN:
			this.joinRoom(data);
			break;
		
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
			
			this.execCommand(data);
			this.broadcast(createMessage(data.UserId, CMD.EVENT, TARGET.ALL, data));
		}
		break;
		}
	}

	joinRoom(data: any) {
		let gameId = parseInt(data.GameId);
		if(this.games[gameId]) {
			
		}
		
		if(gameId === 0) {
			console.log(`GAME ID:0 reject.`);
			return ;
		}
		
		let find = false;
		let master = getGameInfo(gameId);
		if(master) {
			this.games[gameId] = new GameContainer(master);
			this.sessionDic[data.SessionId] = gameId;
			console.log(`GAME ID:${gameId} - ${master.Name} join.`);
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
		
		console.log(`GAME ID:${gameId} leave.`);
	}
	
	public getActiveGames() {
		let games:any = [];
		
		for(var gId in this.games) {
			let us = this.games[gId];
		}
		
		return games;
	}
	
	//処理
	execCommand(data: any) {
		
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
};
