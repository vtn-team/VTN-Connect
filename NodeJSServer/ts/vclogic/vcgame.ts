import { createEpisodeNormalGame, createEpisodeAIGame, saveEpisodeNormalGame, saveEpisodeAIGame, createAdvTitle, ResultCode } from "./vcgameInfo"
import { getUniqueUsers, getUserFromId, getRewardsByGame } from "./vcuser"
import { sendAPIEvent, startRecord, stopRecord } from "../gameserver/server"
import { query } from "./../lib/database"
const { v4: uuidv4 } = require('uuid')
const crypto = require("crypto")

let gameSessions:any = {};
let gameHashDic:any = {};

let artifactEventStack:Array<number> = [0,0,0,0,0,0];
let artifactQR:Array<number> = [0,0,0,0,0];
let artifactEvent:number = 0;
let flagDownTimer:any = null;
let appearArtifact:number = 0;
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
		
		//アーティファクト出現条件チェック
		appearArtifact = getArtifactEvent();
		let owners = await getArtifactOwners();
		
		let users = await choiceAIGameUsers(appearArtifact, owners);
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
		result.Artifacts = owners;
		
		
		//AI記録
		createEpisodeAIGame(gameId, gameHash, users);
		
		//DGSにイベントリレー
		sendAPIEvent({
			API: "gameStartAIGame",
			GameHash: gameHash,
			GameId: gameId,
			GameTitle: title,
			GameUsers: users,
			AppearArtifact: appearArtifact
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
			AppearArtifact: appearArtifact
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



async function choiceAIGameUsers(afEvent:number, owners: any) {
	let userNum = 3;
	let ids:Array<number> = [];
	let join:Array<string> = [];
	
	//アーティファクトオーナーを召喚するか確認
	if(afEvent == 0) {
		let users = [];
		for(let d of owners) {
			if(d.OwnerId == 0) continue;
			users.push(d);
		}
		if(users.length > 0) {
			userNum--;
			
			let rnd = crypto.randomInt(0, users.length);
			ids.push(users[rnd].OwnerId);
			join.push("?");
			
			appearArtifact = users[rnd].Id;
		}
	}
	
	//DBから更新日時が最も古い2～3人を抜き出す
	let player = await query("SELECT Id FROM User WHERE Id > 999 ORDER BY LastPlayedAt ASC LIMIT 0,?",[userNum]);
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

//アーティファクト情報を更新
export async function updateArtifact(ownerUserId: number) {
	let itemId = appearArtifact;
	await query("UPDATE Artifact SET OwnerId = ? WHERE Id = ?", [ownerUserId, itemId]);
	
	if(artifactEvent == itemId) {
		artifactEvent = 0;
	}
	if(flagDownTimer) {
		clearTimeout(flagDownTimer);
	}
	
	//キャッシュ更新
	if(artifactOwners) {
		for(let d of artifactOwners) {
			if(d.Id != itemId) continue;
			
			d.OwnerId = ownerUserId;
			break;
		}
	}
}

export enum ArtifaceEventStack {
	INVALID = 0,
	QRCODE = 1,
	PLAYGAME = 2,
	TALK = 3,
	CHEER = 4
}

/*
- (1) ANY： 5つのQRコードを読み込む
- (2) アーティファクト1： 会場のゲームを10回遊ぶ
- (3) アーティファクト2： 冒険者が10回会話する
- (4) アーティファクト3： 応援メッセージが20通届く(BOT除く)
*/
export async function execArtifactAppearEvent(atrifactEventStackId: ArtifaceEventStack, param:number = 0) {
	if(atrifactEventStackId == 1) {
		artifactQR[param]++;
	}else{
		artifactEventStack[atrifactEventStackId]++;
	}
	
	if(artifactEvent != 0) return;
	
	let flag: Array<number> = [0,0,0,0,0];
	let ids: Array<number> = [];
	let owners: any = await getArtifactOwners();
	for(let d of owners) {
		if(d.OwnerId != 0) {
			flag[d.Id] = 1;
			continue;
		}
		ids.push(d);
	}
	if(ids.length == 0) return ;
	
	console.log("count");
	console.log(artifactEventStack);
	
	switch(atrifactEventStackId) {
	//ドラゴンボールQR
	case 1:
		{
			let appear = true;
			for(let i=0; i<5; ++i){
				if(artifactQR[i] == 0) {
					appear = false;
					break;
				}
			}
			
			if(appear) {
				let rnd = crypto.randomInt(0, ids.length);
				artifactEvent = ids[rnd];
				for(let i=0; i<5; ++i){
					artifactQR[i]--;
				}
			}
		}
		break;
		
	case 2:
		if(flag[1] > 0) break;
		if(artifactEventStack[atrifactEventStackId] >= 10) {
			artifactEvent = 1;
			artifactEventStack[atrifactEventStackId] -= 10;
		}
		break;
		
	case 3:
		if(flag[2] > 0) break;
		if(artifactEventStack[atrifactEventStackId] >= 10) {
			artifactEvent = 2;
			artifactEventStack[atrifactEventStackId] -= 10;
		}
		break;
		
	case 4:
		if(flag[3] > 0) break;
		if(artifactEventStack[atrifactEventStackId] >= 20) {
			artifactEvent = 3;
			artifactEventStack[atrifactEventStackId] -= 20;
		}
		break;
	}
	
	console.log(artifactEvent);
	
	//一定時間経過でイベントフラグを落とす
	flagDownTimer = setTimeout(() => {
		artifactEvent = 0;
	}, 6000);
}

//
export async function setArtifactDebug(id: number) {
	let owners = await getArtifactOwners();
	for(let d of artifactOwners) {
		if(d.OwnerId != 0) continue;
		
		if(d.Id == id) {
			artifactEvent = id;
		}
	}
	return artifactEvent;
}

//
export function getArtifactEvent() {
	return artifactEvent;
}
