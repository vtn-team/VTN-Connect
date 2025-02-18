import { client } from 'websocket'
import { getConnectionAddress } from "./gameserver/server"
import { CMD, TARGET } from "./gameserver/session"


export class TestGameClient {
	protected gameId: number;
	protected linkId: number;
	protected client: any;
	
	constructor(gameId: number, linkId: number) {
		this.gameId = gameId;
		this.linkId = linkId;
	}
	
	public connect() {
		this.client = new client();
		this.client.on('connectFailed', (error: any) => {
			console.log('Connect Error: ' + error.toString());
		});

		let con = null;
		this.client.on('connect', (connection: any) => {
			con = connection;

			connection.on('error', (error: any) => {
				console.log("Connection Error: " + error.toString());
			});
			
			connection.on('close', () => {
				console.log("close");
			});

			connection.on('message', (message: any) => {
				//場合に応じて
				let json = JSON.parse(message.utf8Data);
				let data = JSON.parse(json.Data);
				json.Data = data;

				let msg: string = this.execMessage(json);
				if(msg){
					connection.sendUTF(msg);
					console.log("send:" + msg);
				}
			});
			console.log("connect");
		});
		
		this.client.connect("ws://" + getConnectionAddress, 'echo-protocol');
	}

	execMessage(data: any) {
		console.log(data);
		
		let ret = "";
		switch(data.Command){
		case CMD.WELCOME:
		{
			//SessionIdをキーにしてJoinを返す
			let json = {
				SessionId: data.Data.SessionId,
				Command: CMD.SEND_JOIN,
				GameId: 1,
			};
			ret = JSON.stringify(json);
		}
		break;
		
		case CMD.EVENT:
		{
			
		}
		break;
		
		}
		return ret;
	}
}



export class TestAIGameClient extends TestGameClient {
	protected result: any;
	
	constructor() {
		super(1, 0);
	}
	
	execMessage(data: any) {
		console.log(data);
		
		let ret = "";
		switch(data.Command){
		case CMD.WELCOME:
		{
			//SessionIdをキーにしてJoinを返す
			let json = {
				SessionId: data.Data.SessionId,
				Command: CMD.SEND_JOIN,
				GameId: 1,
			};
			ret = JSON.stringify(json);
		}
		break;
		
		case CMD.EVENT:
		{
			
		}
		break;
		
		}
		return ret;
	}
	
	public async gameStart() {
		this.result = await gameStartAIGame({});
	}
	
	public async gameEnd() {
		let result: any = [];
		for(let d of this.result.GameUsers) {
			result.push({
				UserId: d.UserId,
				GameResult: true,
				MissionClear: true,
				rewards: { Exp: 300, Coin: 200 }
			};
		}
		await gameEndAIGame(result);
	}
}