import { client } from 'websocket'
import { CMD } from "./gameserver/session"

export enum TARGET {
	ALL = 0,
	SELF = 1,
	OTHER = 2
};

(async () => {
	const cli = new client();
	cli.on('connectFailed', (error: any) => {
		console.log('Connect Error: ' + error.toString());
	});

	let con = null;
	cli.on('connect', (connection: any) => {
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

			let msg: string = execMessage(json);
			if(msg){
				connection.sendUTF(msg);
				console.log("send:" + msg);
			}
		});
		console.log("connect");
	});

	cli.connect('ws://localhost:3788', 'echo-protocol');
})();

function execMessage(data: any) {
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