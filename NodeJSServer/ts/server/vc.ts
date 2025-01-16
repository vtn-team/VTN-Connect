import { getConnectionAddress, getActiveSessionNum } from "./../gameserver/server"
import { chatWithSession } from "./../lib/chatgpt"
import { query } from "./../lib/database"
import { getUniqueUsers, createUserWithAI } from "./../vclogic/vcuser"
import { gameStartAIGame, gameEndAIGame, gameStartVC, gameEndVC } from "./../vclogic/vcgame"

//デフォルト関数
export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

//接続アドレスの取得
export async function getaddr(req: any,res: any,route: any)
{
	let addrInfo = getConnectionAddress();
	if(addrInfo == null) {
		return {
			status: 200,
			address: ""
		};
	}
	
	let ret = `ws://${addrInfo.host}:${addrInfo.port}`;
	
	return {
		Status: 200,
		Address: ret
	};
}

//接続人数などを取得する
export async function stat(req: any,res: any,route: any)
{
	return {
		Status: 200,
		IsServerAlive: getConnectionAddress() != null,
		ActiveNum: getActiveSessionNum(),
	};
}

//ChatGPTと会話する
export async function chat(req: any,res: any,route: any)
{
	let threadHash = route.query.threadHash;
	let result = await chatWithSession(threadHash, route.query.prompt);
	
	return {
		Status: 200,
		Result: result
	};
}

//ユーザーを取得する
export async function getUser(req: any,res: any,route: any)
{
	let id = route.query.id;
	let hash = route.query.hash;
	let result = null;
	
	if(id) {
		result = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id = ?", [id]);
	}else{
		result = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE UserHash = ?", [hash]);
	}
	
	result = result[0];
	
	return {
		Status: 200,
		UserData: result
	};
}

//4人ランダム取得
export async function getGameUsers(req: any,res: any,route: any)
{
	let player = await query("SELECT Id FROM User ORDER BY LastPlayedAt ASC LIMIT 0,?",[3]);
	let ids:Array<number> = [];
	let join:Array<string> = [];
	for(let d of player) {
		if(d.Id < 999) continue;
		ids.push(d.Id);
		join.push("?");
	}
	
	let results = [];
	if(ids.length > 0) {
		console.log(ids);
		console.log(join.join(','));
		results = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id IN ("+join.join(',')+");", ids);
		await query("UPDATE User SET LastPlayedAt = CURRENT_TIMESTAMP() WHERE Id IN ("+join.join(',')+");", ids);
	}
	
	results = results.concat(getUniqueUsers(4-ids.length));
	
	return {
		Status: 200,
		result: results
	};
}


//ユーザーを作成する
export async function createUser(req: any,res: any,route: any)
{
	let result = await createUserWithAI();
	
	return {
		Status: 200,
		Success: result.success,
		UserData: result.result
	};
}

//AIゲーム開始
export async function gameStartAI(req: any,res: any,route: any)
{
	let result:any = await gameStartAIGame();
	
	result.Status = 200;
	
	return result;
}

//ゲーム終了
export async function gameEndAI(req: any,res: any,route: any)
{
	let result:any = await gameEndAIGame(route.query);
	
	result.Status = 200;
	
	return result;
}

//ゲーム開始
export async function gameStart(req: any,res: any,route: any)
{
	let result:any = await gameStartVC(route.query.GameId, route.query.UserId);
	
	result.Status = 200;
	
	return result;
}

//ゲーム終了
export async function gameEnd(req: any,res: any,route: any)
{
	let result:any = await gameEndVC(route.query.GameHash, route.query.GameResult);
	
	result.Status = 200;
	
	return result;
}

