import { getConnectionAddress, getActiveSessionNum, updateMaintenance } from "./../gameserver/server"
import { query } from "./../lib/database"
import { getUniqueUsers, createUserWithAI, getUserFromId, getUserFromHash, getUserHistory, getUserMessages, getUserFriends } from "./../vclogic/vcuser"
import { gameStartAIGame, gameEndAIGame, gameStartVC, gameEndVC, getGameHistory, gameHandOver } from "./../vclogic/vcgame"
import { uploadToS3 } from "./../lib/s3"
const { v4: uuidv4 } = require('uuid')

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

//メンテナンス
export async function maintenance(req: any,res: any,route: any)
{
	updateMaintenance(route.query.MaintenanceFlag);

	return {
		Status: 200,
		MaintenanceFlag: route.query.MaintenanceFlag
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

//ユーザーを取得する
export async function getUser(req: any,res: any,route: any)
{
	let result = null;
	
	if(route.query.id) {
		result = await getUserFromId(route.query.id);
	}else{
		result = await getUserFromHash(route.query.hash);
	}
	
	if(route.query.withLog) {
		let history = await getUserHistory(route.query.id);
		result.History = history.History;
		result.HistoryCount = history.Count;
	}
	
	if(route.query.withMessage) {
		let message = await getUserMessages(route.query.id);
		result.Messages = message.Messages;
		result.MessageCount = message.Count;
	}
	
	if(route.query.withFriends) {
		let message = await getUserFriends(route.query.id);
		result.Friends = message.Friends;
		result.FriendCount = message.Count;
	}
	
	return {
		Status: 200,
		UserData: result
	};
}

//冒険の記録を取得する
export async function gameHistory(req: any,res: any,route: any)
{
	let result:any = await getGameHistory(route.query.id);
	
	result.Status = 200;
	
	return result;
}

//冒険の記録を取得する
export async function userHistory(req: any,res: any,route: any)
{
	let result:any = await getUserHistory(route.query.id, route.query.page);
	
	result.Status = 200;
	
	return result;
}

//応援の記録を取得する
export async function userMessage(req: any,res: any,route: any)
{
	let result:any = await getUserMessages(route.query.id, route.query.page);
	
	result.Status = 200;
	
	return result;
}

//出会いの記録を取得する
export async function friendList(req: any,res: any,route: any)
{
	let result = await getUserFriends(route.query.id, route.query.page);
	
	return {
		Status: 200,
		Friends: result
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
	let result = await createUserWithAI(route.query);
	
	return {
		Status: 200,
		Success: result.success,
		UserData: result.result
	};
}

//AIゲーム開始
export async function gameStartAI(req: any,res: any,route: any)
{
	let result:any = await gameStartAIGame(route.query.Option);
	
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
	let result:any = await gameStartVC(route.query.GameId, route.query.UserId, route.query.Option);
	
	result.Status = 200;
	
	return result;
}

//ゲーム終了
export async function gameEnd(req: any,res: any,route: any)
{
	let resultCode = route.query.GameResult ? 2 : 3;
	let result:any = await gameEndVC(route.query.GameHash, resultCode);
	
	result.Status = 200;
	
	return result;
}

//交代
export async function handOver(req: any,res: any,route: any)
{
	let result:any = await gameHandOver(route.query.GameId, route.query.UserId, route.query.Option);
	let user: any = await getUserFromId(route.query.UserId);
	
	result.Status = 200;
	result.UserData = user;
	
	return result;
}

//AIゲームの冒険の書を作るテスト
export async function epictest(req: any,res: any,route: any)
{
	let result:any = await gameStartAIGame(0);
	setTimeout(async () => {
		let rnd1 = (Math.random() < 0.5);
		let rnd2 = (Math.random() < 0.5);
		
		let gameData = [];
		for(let u of result.GameUsers) {
			gameData.push({
				UserId: u.UserId,
				GameResult: rnd1,
				MissionClear: rnd2
			});
		}
		
		await gameEndAIGame({
			GameHash: result.GameHash,
			UserResults: gameData
		});
	}, 1000);
}

