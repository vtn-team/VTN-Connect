
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

export class VantanConnect {
	games: any;
	sessionDic: any;
	broadcast: any;

	gameInfoMaster: any;
	gameEventMaster: any;

	constructor(bc: any) {
		this.games = {};
		this.sessionDic = {};
		this.broadcast = bc;
	}

	public execMessage(data: any) {
		switch(data["Command"])
		{
		case CMD.SEND_JOIN:
			this.joinRoom(data);
			break;
		
		case CMD.SEND_EVENT:
		{
			let userId = data["UserID"];
			createMessage(userId, CMD.EVENT, TARGET.ALL, data);
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
		let master = null;
		for(var m of this.gameInfoMaster){
			if(parseInt(m.Id) == gameId){
				find = true;
				master = m;
				break;
			}
		}
		
		if(find) {
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
};