import { createEpisodeNormalGame, createEpisodeAIGame, saveEpisodeNormalGame, saveEpisodeAIGame, createAdvTitle, ResultCode } from "./vcgameInfo"
import { getUniqueUsers, getUserFromId, getRewardsByGame } from "./vcuser"
import { sendAPIEvent, startRecord, stopRecord } from "../gameserver/server"
import { query } from "./../lib/database"
const { v4: uuidv4 } = require('uuid')

let gameSessions:any = {};
let gameHashDic:any = {};

let artifactOwners: any = null;

enum GameOption {
	None = 0,
	Recording = (1<<0),
}

function simpleUserInfo(userInfo: any) : any
{
	if(userInfo.length && userInfo.length > 1) {
		let ret = [];
		for(let u of userInfo) {
			ret.push(simpleUserInfo(u));
		}
		return ret;
	}else{
		//シンプルにする
		return {
			UserId: userInfo.UserId,
			Name: userInfo.DisplayName,
			AvatarType: userInfo.AvatarType,
		};
	}
	
	return null;
}

//AIゲーム開始
//NOTE: 誰を使うかはサーバが決定する
export async function gameStartAIGame(option: number) {
	let result = {
		Success: false,
		GameHash: "",
		GameTitle: "",
		GameUsers: [],
		Artifacts: []
	};
	
	try {
		let gameHash = uuidv4();
		let users = await choiceAIGameUsers();
		let gameId = 1; //NOTE: ハードコードで良くないが良い手段がない
		
		//DBに保存
		
		//Gameにプレイ開始したゲームの情報を記録
		await query("INSERT INTO Game (GameHash, GameId, State) VALUES (?, ?, 1)", [gameHash, gameId]);
		
		//AIゲームは開始時にタイトルを決める
		let title:any = await createAdvTitle(gameId, users);
		
		startRecord(gameId, gameHash);
		
		result.Success = true;
		result.GameHash = gameHash;
		result.GameUsers = users;
		result.GameTitle = title;
		result.Artifacts = await getArtifactOwners();
		
		//AI記録
		createEpisodeAIGame(gameId, gameHash, users);
		
		//DGSにイベントリレー
		sendAPIEvent({
			API: "gameStartAIGame",
			GameHash: gameHash,
			GameId: gameId,
			GameTitle: title,
			GameUsers: users,
		});
		
		//稼働中ログ
		let delList= [];
		for(let k in gameHashDic) {
			if(gameHashDic[k] == gameId){
				delList.push(k);
			}
		}
		for(let k of delList) {
			delete gameHashDic[k];
		}
		
		gameHashDic[gameHash] = gameId;
		gameSessions[gameId] = {
			Status: 1,
			GameHash: gameHash,
			GameId: gameId,
			GameUsers: simpleUserInfo(users),
			GameTitle: title,
		}
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}

//ゲーム終了
export async function gameEndAIGame(gameResult: any) {
	let result = {
		Success: false,
	};
	
	try {
		result.Success = true;
		
		let gameHash = gameResult.GameHash;
		
		let title = "";
		if(gameHashDic[gameHash]) {
			let gameId = gameHashDic[gameHash];
			title = gameSessions[gameId].GameTitle;
		}
		
		stopRecord(gameHash);
		
		//awaitはしない
		saveEpisodeAIGame(gameHash, title, gameResult.UserResults);
		
		//DGSにイベントリレー
		sendAPIEvent({
			API: "gameEndAIGame",
			GameHash: gameHash,
			GameResult: gameResult,
		});
		
		//稼働中ログ
		let gameId = 1; //NOTE: ハードコードで良くないが良い手段がない
		gameSessions[gameId] = {
			Status: 0,
		}
		
		if(gameHashDic[gameHash]) {
			delete gameHashDic[gameHash];
		}
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}


//ゲーム開始
export async function gameStartVC(gameId: number, userId: number, option: number) {
	let result = {
		Success: false,
		GameHash: ""
	};
	
	try {
		let gameHash = uuidv4();
		let userInfo = null;
		
		//Gameにプレイ開始したゲームの情報を記録
		if(userId > 0) {
			await query("INSERT INTO Game (GameHash, GameId, State) VALUES (?, ?, 1)", [gameHash, gameId]);
			userInfo = await getUserFromId(userId);
			createEpisodeNormalGame(gameId, gameHash, userInfo);
		} else {
			await query("INSERT INTO Game (GameHash, GameId, State) VALUES (?, ?, 3)", [gameHash, gameId]);
		}
		
		if(option & GameOption.Recording) {
			startRecord(gameId, gameHash);
		}
		
		result.GameHash = gameHash;
		result.Success = true;
		
		//DGSにイベントリレー
		sendAPIEvent({
			API: "gameStartVC",
			GameHash: gameHash,
			GameId: gameId,
			UserId: userId,
			UserData: userInfo,
		});
		
		//稼働中ログ
		let delList= [];
		for(let k in gameHashDic) {
			if(gameHashDic[k] == gameId){
				delList.push(k);
			}
		}
		for(let k of delList) {
			delete gameHashDic[k];
		}
		
		gameHashDic[gameHash] = gameId;
		gameSessions[gameId] = {
			Status: 1,
			GameHash: gameHash,
			GameId: gameId,
			UserId: userId,
			StartTime: new Date()
		}
		if(userInfo) {
			gameSessions[gameId]["UserInfo"] = simpleUserInfo(userInfo);
		}
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}


//ゲーム終了
export async function gameEndVC(gameHash: string, resultCode: ResultCode) {
	let result = {
		Success: false,
		Rewards: {}
	};
	
	try {
		await query("UPDATE Game SET State = ? WHERE GameHash = ?", [resultCode, gameHash]);
		result.Success = true;
		
		stopRecord(gameHash);
		
		//DGSにイベントリレー
		//NOTE: UserInfoは取ろうと思えばとれる
		sendAPIEvent({
			API: "gameEndVC",
			GameHash: gameHash,
			GameResult: resultCode
		});
		
		//稼働中ログ
		if(gameHashDic[gameHash]) {
			let gameId = gameHashDic[gameHash];
			
			//報酬付与
			let time = ((new Date()).getTime() - gameSessions[gameId].StartTime);
			let userId = gameSessions[gameId].UserId;
			
			gameSessions[gameId] = {
				Status: 0,
			}
			delete gameHashDic[gameHash];
			
			let rewards:any = await getRewardsByGame(gameId, userId, resultCode, time);
			result.Rewards = rewards;
			
			//awaitはしない
			saveEpisodeNormalGame(gameHash, resultCode, rewards);
		}
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}


//ゲーム交代
export async function gameHandOver(gameId: number, userId: number, option: number) {
	let result = {
		Success: false,
		GameHash: "",
		Rewards: {}
	};
	
	try {
		//稼働中であればGameEndする
		let gameHash = "";
		for(let k in gameHashDic) {
			if(gameHashDic[k] == gameId){
				gameHash = k;
				break;
			}
		}
		if(gameHash != "") {
			let gameEnd = await gameEndVC(gameHash, 4);
			result.Rewards = gameEnd.Rewards;
		}
		
		let res = await gameStartVC(gameId, userId, option);
		
		result.GameHash = res.GameHash;
		
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}



async function choiceAIGameUsers() {
	//DBから更新日時が最も古い3人を抜き出す
	let player = await query("SELECT Id FROM User ORDER BY LastPlayedAt ASC LIMIT 0,?",[3]);
	let ids:Array<number> = [];
	let join:Array<string> = [];
	for(let d of player) {
		if(d.Id < 999) continue;
		ids.push(d.Id);
		join.push("?");
	}
	
	//残りはユニークユーザで埋める
	let users = [];
	if(ids.length > 0) {
		console.log(ids);
		console.log(join.join(','));
		users = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id IN ("+join.join(',')+");", ids);
		await query("UPDATE User SET LastPlayedAt = CURRENT_TIMESTAMP() WHERE Id IN ("+join.join(',')+");", ids);
	}
	
	users = users.concat(getUniqueUsers(4-ids.length));
	return users;
}

export function getGameSessions() {
	return gameSessions;
}

export async function getGameHistory(gameId: number, page: number = 0) {
	let result = null;
	let count = 0;
	let limit = 25;
	
	if(gameId == 0) {
		result = await query("SELECT * FROM Adventure LIMIT 0,?", [limit]);
		//await query("SELECT count(GameHash) as Count FROM Adventure WHERE GameId = ?", [gameId]);
	} else {
		result = await query("SELECT * FROM Adventure WHERE GameId = ? LIMIT 0, ?", [gameId,limit]);
		//await query("SELECT count(GameHash) as Count FROM Adventure WHERE GameId = ?", [gameId]);
	}
	
	return {
		History: result,
		//Count: Number(count[0].Count)
	};
}

export async function getArtifactOwners() {
	if(artifactOwners) return artifactOwners;
	
	artifactOwners = await query("SELECT * FROM Artifact", [0]);
	return artifactOwners;
}

export async function updateArtifact(itemId: number, ownerUserId: number) {
	await query("UPDATE Artifact SET OwnerId = ? WHERE Id = ?", [ownerUserId, itemId]);
	
	//キャッシュ更新
	if(artifactOwners) {
		for(let d of artifactOwners) {
			if(d.Id != itemId) continue;
			
			d.OwnerId = ownerUserId;
			break;
		}
	}
}
