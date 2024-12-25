import { getConnectionAddress, getActiveSessionNum } from "./../gameserver/server"
import { chatWithSession } from "./../lib/chatgpt"
import { query } from "./../lib/database"
import { getUniqueUsers, createUserWithAI } from "./../vclogic/vcuser"

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
		status: 200,
		address: ret
	};
}

//接続人数などを取得する
export async function stat(req: any,res: any,route: any)
{
	return {
		status: 200,
		isServerAlive: getConnectionAddress() != null,
		activeNum: getActiveSessionNum(),
	};
}

//ChatGPTと会話する
export async function chat(req: any,res: any,route: any)
{
	let threadHash = route.query.threadHash;
	let result = await chatWithSession(threadHash, route.query.prompt);
	
	return {
		status: 200,
		result: result
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
	
	return {
		status: 200,
		result: result
	};
}

//4人ランダム取得
export async function getGameUsers(req: any,res: any,route: any)
{
	let player = await query("SELECT Id FROM User ORDER BY LastPlayedAt ASC LIMIT 0,?",[3]);
	let ids:Array<number> = [];
	for(let d of player) {
		ids.push(d.Id);
	}
	let results = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id IN (?,?,?);", ids);
	await query("UPDATE User SET LastPlayedAt = CURRENT_TIMESTAMP() WHERE Id IN (?,?,?);", ids);
	
	results = results.concat(getUniqueUsers(4-ids.length));
	
	return {
		status: 200,
		result: results
	};
}


//ユーザーを作成する
export async function createUser(req: any,res: any,route: any)
{
	let result = await createUserWithAI();
	
	return {
		status: 200,
		success: result.success,
		result: result.result
	};
}
