import { updateMainGameInfo } from "./vcinfo"
import { createEpisodeNormalGame, createEpisodeAIGame, saveEpisodeNormalGame, saveEpisodeAIGame } from "./vcgameInfo"
import { getUniqueUsers, getUserFromId } from "./vcuser"
import { sendAPIEvent, startRecord, stopRecord } from "../gameserver/server"
import { query } from "./../lib/database"
const { v4: uuidv4 } = require('uuid')

enum GameOption {
	None = 0,
	Recording = (1<<0),
}

//ゲーム情報構造体

//AIゲーム開始
//NOTE: 誰を使うかはサーバが決定する
export async function gameStartAIGame(option: number) {
	let result = {
		Success: false,
		GameHash: "",
		GameUsers: [],
		GameInfo: []
	};
	
	try {
		let gameHash = uuidv4();
		let users = await choiceAIGameUsers();
		let gameId = 1; //NOTE: ハードコードで良くないが良い手段がない
		
		//DBに保存
		
		//Gameにプレイ開始したゲームの情報を記録
		await query("INSERT INTO Game (GameHash, GameId, State) VALUES (?, ?, 1)", [gameHash, gameId]);
		
		result.Success = true;
		result.GameHash = gameHash;
		result.GameUsers = users;
		
		//AI記録
		createEpisodeAIGame(gameId, gameHash, users);
		
		//DGSにイベントリレー
		sendAPIEvent({
			API: gameStartAIGame,
			GameHash: gameHash,
			GameUsers: users,
		});
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
		
		let hash = gameResult.GameHash;
		
		//awaitはしない
		saveEpisodeAIGame(hash, gameResult.UserResults);
		
		//DGSにイベントリレー
		sendAPIEvent({
			API: gameStartAIGame,
			GameHash: hash,
			GameResult: gameResult,
		});
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
			let userInfo = await getUserFromId(userId);
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
			API: gameStartVC,
			GameHash: gameHash,
			UserId: userId,
			UserInfo: userInfo,
		});
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}


//ゲーム終了
export async function gameEndVC(gameHash: string, gameResult: boolean) {
	let result = {
		Success: false,
	};
	
	try {
		await query("UPDATE Game SET State = ? WHERE GameHash = ?", [gameResult ? 2 : 3, gameHash]);
		result.Success = true;
		
		stopRecord(gameHash);
		
		//awaitはしない
		saveEpisodeNormalGame(gameHash, gameResult);
		
		//DGSにイベントリレー
		//NOTE: UserInfoは取ろうと思えばとれる
		sendAPIEvent({
			API: gameStartVC,
			GameHash: gameHash,
			GameResult: gameResult
		});
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
