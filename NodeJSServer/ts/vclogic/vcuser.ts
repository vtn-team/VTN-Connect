import { chatWithSession } from "./../lib/chatgpt"
import { getMaster, getLevel, getGameInfo, getAIRule } from "./../lib/masterDataCache"
import { sendAPIEvent } from "../gameserver/server"
import { query } from "./../lib/database"
import { ResultCode } from "./vcgameInfo"
const { v4: uuidv4 } = require('uuid')

let userSession:any = {};
let uniqueUsers:any = [];
let userCountCache = 0;
let userAskLog: any = {};

interface UserStatus {
	Name:string;
	Questions :Array<string>;
}

//ユニークユーザをあっためておく
export async function preloadUniqueUsers() {
	let result = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id < ?",[100]);
	uniqueUsers = result;
	//console.log(uniqueUsers);
	let cc:any = await query("SELECT count(Id) as Count FROM User", [0]);
	userCountCache = Number(cc[0].Count);
}

//ユニークユーザを特定数分取得
export function getUniqueUsers(num: number) {
	let reserve:any = [];
	let reserveId:any = [];
	let stock:any = [];
	
	for(let i=0; i<num; ++i){
		if(stock.length == 0) {
			let playCount = 9999;
			for(var d of uniqueUsers){
				if(reserveId.indexOf(d.Id) != -1)
					continue;
				
				if(d.PlayCount < playCount)
					playCount = d.PlayCount;
			}
			
			for(var d of uniqueUsers){
				if(d.PlayCount == playCount){
					stock.push(d);
				}
			}
		}
		
		let idx = Math.floor(Math.random()*stock.length);
		let data = stock.splice(idx,1)[0];
		reserve.push(data);
		reserveId.push(data.Id)
	}
	
	for(var d of reserve) {
		d.PlayCount++;
	}
	
	return reserve;
}

//ユニークユーザを特定数分取得
export function getAllUniqueUsers() {
	return uniqueUsers;
}

async function createUserFromChatGPT(sessionId:string|null, userInput: UserStatus) {
	let prompt = getAIRule("CreateUser").RuleText;
	
	const questions = [
	[
		"貴族の屋敷",
		"馬小屋",
		"一般家庭",
		"山中(野生児化)",
	],
	[
		"お宝見つけて一攫千金を狙う",
		"最強のプレイヤーになる",
		"安全に細々と暮らす",
		"ワンワン！！ ワオーン！！",
	],
	[
		"無謀である",
		"承認欲求が強い",
		"飽きっぽい",
		"ワンワン！！ ワオーン！！",
	],
	[
		"安全に頑張りましょう",
		"命懸けの冒険をしよう",
		"友達たくさん作ってね",
		"ワンワン！！ ワオーン！！",
	]];
	prompt = prompt.replace("<UserName>", userInput.Name);
	for(let i=0; i<4; ++i) {
		let q = parseInt(userInput.Questions[i])-1;
		if(q < 0 || q >= 4) {
			prompt = prompt.replace(`<Q${(i+1)}>`, "無回答");
			continue;
		}
		console.log(q);
		prompt = prompt.replace(`<Q${(i+1)}>`, questions[i][q]);
	}
	
	prompt += `
# 出力例(JSON)\n
{
	"FullName":$[キャラクターの本名],
	"DisplayName":$[キャラクターの表示名],
	"Gender":$[性別],
	"AvatarType":$[0-11],
	"Age":$[年齢],
	"Job":$[職業],
	"Personality":$[性格],
	"Motivation":$[モチベーション],
	"Weaknesses":$[弱点],
	"Background":$[簡潔なバックストーリー]
}`;

	let chatres:any = await chatWithSession(sessionId, prompt);
	return chatres;
}

async function checkCreateUserFromChatGPT(sessionId:string) {
	let prompt = getAIRule("CheckUser").RuleText;
	prompt += `
# 出力例(JSON)\n
{
    judge: [OK/NG],
    reason: [判断理由]
}`;
	
	let chatres:any = await chatWithSession(sessionId, prompt);
	let json = JSON.parse(chatres.content);
	return json;
}


//ユーザを作成する
export async function createUserWithAI(userInput: UserStatus) {
	let userHash = uuidv4();
	let success = false;
	let result: any = {};
	
	try {
		let json:any = {};
		let session:string|null = null;
		for(let i=0; i<5; ++i) {
			let data:any = await createUserFromChatGPT(session, userInput);
			json = JSON.parse(data.content);
			session = data.sessionId;
			if(session == null) throw new Error("session無効");
			let check = await checkCreateUserFromChatGPT(session);
			if(check.judge="OK"){
				console.log(check);
				break;
			}
		}
		if(session == null) throw new Error("session無効");
		
		//threadIdと同期させる
		userHash = session;
		
		//DBに保存
		let ins = await query("INSERT INTO User (UserHash, Type, Name) VALUES (?, 1, ?)", [userHash, json.FullName]);
		let userId = Number(ins.insertId);
		
		//let data = await query("SELECT Id FROM User WHERE UserHash = ?", [userHash]);
		//console.log(data);
		
		let status: Array<any> = [userId, json.DisplayName, json.AvatarType, json.Gender, json.Age, json.Job, json.Personality, json.Motivation,json.Weaknesses, json.Background];
		query("INSERT INTO UserGameStatus (UserId, DisplayName, AvatarType, Gender, Age, Job, Personality, Motivation, Weaknesses, Background) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", status);
		
		userCountCache++;
		
		result.Name = json.FullName;
		delete json["FullName"];
		result.UserId = userId;
		result.UserHash = userHash;
		result.Type = 1;	//NOTE: ハードコード
		result.Level = 1;	//NOTE: ハードコード
		result.Gold = 500;	//NOTE: ハードコード
		for(var k in json) {
			result[k] = json[k];
		}
		
		//DGSにイベントリレー
		sendAPIEvent({
			API: "createUser",
			UserId: userId,
			UserData: result
		});
		
		success = true;
	} catch(ex) {
		console.log(ex);
	}
	
	return {
		success: success,
		result: result
	}
}

export async function getUsers(page: number = 0) {
	let limit = 25;
	let result = await query("SELECT * FROM User LIMIT 0,?", [limit]);
	
	return {
		History: result,
		Count: userCountCache
	};
}

export async function getUserFromId(id: number) {
	let result = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id = ?", [id]);
	if(result.length == 0) return null;
	return result[0];
}

export async function getUserFromHash(hash: string) {
	let result = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE UserHash = ?", [hash]);
	if(result.length == 0) return null;
	return result[0];
}

export async function getUserHistory(userId: number, page: number = 0) {
	let result = await query("SELECT * FROM Adventure WHERE UserId = ? ORDER BY CreatedAt DESC LIMIT 0, 10", [userId]);
	let count = await query("SELECT count(GameHash) as Count FROM Adventure WHERE UserId = ?", [userId]);
	
	return {
		History: result,
		Count: Number(count[0].Count)
	};
}

export async function getUserMessages(userId: number, page: number = 0) {
	let result = await query("SELECT * FROM Message WHERE ToUserId = ? ORDER BY CreatedAt DESC LIMIT 0, 10", [userId]);
	let count = await query("SELECT count(Id) as Count FROM Message WHERE ToUserId = ?", [userId]);
	
	return {
		Messages: result,
		Count: Number(count[0].Count)
	};
}

export async function getUserFriends(userId: number, page: number = 0) {
	let result = await query("SELECT * FROM Friend WHERE UserId = ? ORDER BY CreatedAt DESC LIMIT 0, 10", [userId]);
	let count = await query("SELECT count(UserId) as Count FROM Friend WHERE UserId = ?", [userId]);
	
	return {
		Friends: result,
		Count: Number(count[0].Count)
	};
}

export async function questRewards(userId: number) {
	let ret = {
		Exp: 0,
		Coin: 0,
	};
	
	let level = getMaster("Level");
	if(!level) return ret;
	
	let userInfo = await getUserFromId(userId);
	if(!userInfo) return ret;
	
	
}

function getUserLevel(exp: number) {
	let ret = 1;
	for(let lv = 1; lv < 50; ++lv) {
		let level = getLevel(lv);
		exp -= level.NeedExp;
		if(exp < 0) {
			ret = lv-1;
			break;
		}
	}
	return ret;
}

export async function getRewardsByEventCode(userId: number, gold: number, exp:number) {
	let ret = {
		Exp: exp,
		Coin: gold,
	};
	
	let level = getMaster("Level");
	if(!level) return ret;
	
	let userInfo = await getUserFromId(userId);
	if(!userInfo) return ret;
	
	//ユーザ情報更新
	let totalGold = userInfo.Gold + ret.Coin;
	let totalExp = userInfo.Exp + ret.Exp;
	let lv = getUserLevel(totalExp);
	
	await query("UPDATE User SET Level = ?, Exp = ?, Gold = ? WHERE Id = ?", [lv, totalExp, totalGold, userId]);
	
	return {
		Lv: lv,
		Exp: totalExp,
		Gold: totalGold
	};
}

export async function getRewardsByGame(gameId: number, userId: number, resultCode: ResultCode, time: number) {
	let ret = {
		Exp: 0,
		Coin: 0,
	};
	
	let level = getMaster("Level");
	if(!level) return ret;
	
	let master = getGameInfo(gameId);
	if(!master) return ret;
	
	let userInfo = await getUserFromId(userId);
	if(!userInfo) return ret;
	
	switch(resultCode) {
	default:
	case ResultCode.INVALID:
	case ResultCode.IN_PROGRESS:
		break;
		
	case ResultCode.SUCCESS:
		{
			ret.Exp = master.ClearBonusExp;
			ret.Coin = master.ClearBonusCoin;
		}
		break;
		
	case ResultCode.FAILED:
	case ResultCode.HANDOVER:
		{
			let rate = 1.0;
			if(time < master.PlayTime) {
				rate = time / master.PlayTime;
			}
			
			ret.Exp = master.GameOverBonusExp;
			ret.Coin = master.GameOverBonusCoin;
		}
		break;
	}
	
	//ユーザ情報更新
	let gold = userInfo.Gold + ret.Coin;
	let exp = userInfo.Exp + ret.Exp;
	let lv = getUserLevel(exp);
	
	await query("UPDATE User SET Level = ?, Exp = ?, Gold = ? WHERE Id = ?", [lv, exp, gold, userId]);
	
	return ret;
}

export async function gameAskAndReward(askVal: any) {
	let userInfo = await getUserFromId(askVal.UserId);
	if(!userInfo) return {
		Status: 500,
		Message: "ユーザが見つからない"
	};
	
	if(!userAskLog[askVal.UserId]) {
		userAskLog[askVal.UserId] = {}
	}
	
	let error = false;
	try {
		await query("INSERT INTO GameReview (UserId, GameId, GameTitle, Gender, Age, Originality, Funny, Quality, Rule, Replay, Speciality, Improvement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
			askVal.UserId, askVal.GameId, askVal.GameTitle, askVal.Gender, askVal.Age,askVal.Originality, askVal.Funny, askVal.Quality, askVal.Rule, askVal.Replay, askVal.Speciality, askVal.Improvement
		]);
	}catch(ex){
		error = true;
		console.log(ex);
	}
	
	if(error) return {
		Status: 500,
		Message: "アンケートでエラーが発生しました"
	};
	
	let reward = {};
	if(!userAskLog[askVal.UserId][askVal.GameId]) {
		//ユーザ情報更新
		let gold = userInfo.Gold + 500;
		let exp = userInfo.Exp + 500;
		let lv = getUserLevel(exp);
		
		await query("UPDATE User SET Level = ?, Exp = ?, Gold = ? WHERE Id = ?", [lv, exp, gold, askVal.UserId]);
		userAskLog[askVal.UserId][askVal.GameId] = 1;
		
		reward = {
			Exp: exp,
			Level: lv,
			Gold: gold
		};
	}
	
	return {
		Status: 200,
		Message: "OK",
		Reward: reward
	};
}