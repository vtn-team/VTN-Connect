import { getMaster, getGameInfo, getGameEvent, getAIRule } from "../lib/masterDataCache"
import { sendAPIEvent, startRecord, stopRecord } from "../gameserver/server"
import { chat, chatWithContextsText } from "./../lib/chatgpt"
//import { chat } from "./../lib/gemini"
import { query } from "./../lib/database"
import { uploadToS3 } from "./../lib/s3"
const { v4: uuidv4 } = require('uuid')
const crypto = require("crypto")

interface Episode {
	getEpisodePrompt(userInfo: any) : any;
}

export enum ResultCode {
	INVALID = 0,
	IN_PROGRESS = 1,
	SUCCESS = 2,
	FAILED = 3,
	HANDOVER = 4,
}

//ゲーム情報構造体
export class GameEpisode {
	episode: any;

	constructor(episode: any) {
		this.episode = episode;
	}
	
	public getEpisodePrompt(userInfo: any) {
		let master = getGameEvent(this.episode.EpisodeCode);
		let prompt = `
# 発生した物語\n
- 発生日時${new Date()}
- 何が起きたか
  - ${master.Description}
`;
		if(this.episode.Episode) {
			prompt += `
- どういうことが起きたか
  - ${this.episode.Episode}
`;
		}
		
		if(this.episode.Payload.length > 0) {
			prompt += "- 補足情報\n";
			for(let data of this.episode.Payload) {
				prompt += `  - ${data.Description}: ${data.Data}`;
			}
		}
		return { role: "user", content: prompt };
	}
};

//キャラ設定
export class CharacterSetting {
	gameId: number;

	constructor(gameId: number) {
		this.gameId = gameId;
	}
	
	public getEpisodePrompt(userInfo: any) {
		let prompt = `
# キャラクター設定\n
- 名前:${userInfo.Name}
- 性別:${userInfo.Gender}
- 年齢:${userInfo.Age}
- 職業:${userInfo.Job}
- 性格:${userInfo.Personality}
- モチベーション:${userInfo.Motivation}
- 弱点:${userInfo.Weaknesses}
- バックストーリー:${userInfo.Background}
`;
		return { role: "user", content: prompt };
	}
};

//ゲーム開始
export class GameStart {
	gameId: number;

	constructor(gameId: number) {
		this.gameId = gameId;
	}
	
	public getEpisodePrompt(userInfo: any) {
		let master = getGameInfo(this.gameId);
		
		let prompt = "";
		if(this.gameId == 1) {
			prompt = `
# 今回の冒険先\n
ダンジョン
`;
		}else{
			prompt = `
# 今回の冒険先
${master.GameTitle}で遊んだ

# 難易度(10がふつう)
${master.Difficulty}
`;
		}
		
		return { role: "user", content: prompt };
	}
};

//1回のゲームでのエピソード
class EpisodeBook {
	gameId: number;
	gameHash: string;
	userInfo: any;
	episodes: Array<Episode>;
	talkUsers: Array<number>;

	constructor(gameId: number, gameHash: string, userInfo: any) {
		this.gameId = gameId;
		this.gameHash = gameHash;
		this.userInfo = userInfo;
		this.episodes = [
			new CharacterSetting(gameId),
			new GameStart(gameId),
		];
		this.talkUsers = [];
	}
	
	public getFriendTalkNum() {
		return this.talkUsers.length;
	}
	
	public addFriendTalkNum(userId: number) {
		if(this.talkUsers.indexOf(userId) != -1) return;
		this.talkUsers.push(userId);
	}
	
	public getGameId() {
		return this.gameId;
	}
	
	public stockEpisode(data: GameEpisode) {
		this.episodes.push(data);
	}
	
	public getEpisodePrompt() {
		let contexts = [];
		for(let ep in this.episodes) {
			contexts.push(this.episodes[ep].getEpisodePrompt(this.userInfo));
		}
		return contexts;
	}
};

//全ゲーム管理
class Epic {
	books: any

	constructor() {
		this.books = {};
	}
	
	getBookHash(gameHash: string, userId: number) {
		return gameHash + "__" + userId;
	}
	
	public createEpisode(gameId: number, gameHash: string, userInfo: any) {
		let hash = this.getBookHash(gameHash, userInfo.UserId);
		this.books[hash] = new EpisodeBook(gameId, gameHash, userInfo);
	}
	
	public getEpisodeBook(gameHash: string, userId: number) {
		let hash = this.getBookHash(gameHash, userId);
		
		if(!this.books[hash]) return null;
		return this.books[hash];
	}
	
	public stockEpisode(gameHash: string, userId: number, data: GameEpisode) {
		let hash = this.getBookHash(gameHash, userId);
		if(!this.books[hash]) {
			return ;
		}
		
		this.books[hash].stockEpisode(data);
	}
	
	public deleteEpisode(gameHash: string, userId: number) {
		let hash = this.getBookHash(gameHash, userId);
		if(!this.books[hash]) {
			return ;
		}
		
		delete this.books[hash];
	}
};

let epic = new Epic();
let userCache: any = { };

//
export function createEpisodeNormalGame(gameId: number, gameHash: string, userInfo: any) {
	//
	epic.createEpisode(gameId, gameHash, userInfo);
	cacheUser(gameHash, userInfo);
	console.log("create episode");
}

//
export async function saveEpisodeNormalGame(gameHash: string, resultCode: ResultCode, rewards: any) {
	let userInfo = getCachedUser(gameHash);
	if(!userInfo) return;
	let episode = epic.getEpisodeBook(gameHash, userInfo.UserId);
	if(!episode) return;
	
	let master = getGameInfo(episode.getGameId());
	let messages = episode.getEpisodePrompt();
	
	console.log("save episode");
	
	let rule = getAIRule("CreateEpic_" + master.ProjectCode);
	if(!rule) rule = getAIRule("CreateEpic");
	let prompt = rule.RuleText;
	switch(resultCode) {
	case ResultCode.INVALID:
	case ResultCode.IN_PROGRESS:
		break;
		
	case ResultCode.SUCCESS:
		prompt += "\n\n# 冒険の結末\n- 成功";
		break;
		
	case ResultCode.FAILED:
	prompt += "\n\n# 冒険の結末\n- 失敗";
		break;
		
	case ResultCode.HANDOVER:
		prompt += "\n\n# 冒険の結末\n- 別の人に託した";
		break;
	}
	
	messages.push({ role: "user", content: prompt });
	
	let users = [userInfo];
	let title = await createAdvTitle(episode.getGameId(), users);
	
	let msg:any = await chatWithContextsText(messages);
	
	let logId = uuidv4();
	let json = {
		Episode: messages,
		StoryBook: msg.content,
		Rewards: rewards
	};
	await query("INSERT INTO Adventure (GameHash, UserId, GameId, Title, PlayerName, Result, LogId) VALUES (?, ?, ?, ?, ?, ?, ?)", [gameHash, userInfo.UserId, episode.getGameId(), title, userInfo.DisplayName, resultCode, logId]);
	console.log(json);
	await uploadToS3(logId, JSON.stringify(json));
	
	epic.deleteEpisode(gameHash, userInfo.UserId);
	deleteCachedUser(gameHash);
	
	console.log("complete message");
}

//物語の記録を開始(AIゲーム)
export function createEpisodeAIGame(gameId: number, gameHash: string, users: any) {
	if(!users) return;
	
	//プレイするユーザの情報を4人分記録
	for(let u of users) {
		epic.createEpisode(gameId, gameHash, u);
		console.log("create episode");
	}
	cacheUser(gameHash, users);
	console.log("cached aigame users");
}

//物語生成(AIゲーム)
export async function saveEpisodeAIGame(gameHash: string, title: string, gameResult: any) {
	//ユーザのリストが入っている
	let users = getCachedUser(gameHash);
	if(!users) return;
	
	console.log(gameResult);
	
	let rule = getAIRule("CreateEpic_VCMain");
	
	for(let result of gameResult) {
		let target = null;
		for(let u of users) {
			if(u.UserId != result.UserId) continue;
			target = u;
			break;
		}
		
		let episode = epic.getEpisodeBook(gameHash, result.UserId);
		if(!episode) continue;
		
		let resNumber = 0;
		let prompt = rule.RuleText;
		if(result.GameResult) {
			prompt += "\n\n# 冒険の結末\n- 成功";
			resNumber += 10;
		}else{
			if(episode.getFriendTalkNum()>0){
				let rnd = crypto.randomInt(0, episode.getFriendTalkNum());
				if(rnd >= 2) {
					prompt += "\n\n# 冒険の結末\n- 失敗したが仲間に救出される";
					resNumber += 30;
				}
			}
			if(resNumber < 30) {
				prompt += "\n\n# 冒険の結末\n- 失敗";
				resNumber += 20;
			}
		}
		if(result.MissionClear) {
			prompt += "\n\n# 冒険の目的\n- 達成";
			resNumber += 100;
		}else{
			prompt += "\n\n# 冒険の目的\n- 未達成";
		}
		
		let messages = episode.getEpisodePrompt();
		messages.push({ role: "user", content: prompt });
		//console.log(messages);
		
		let msg:any = await chatWithContextsText(messages);
		//console.log(msg);
		
		let logId = uuidv4();
		let json = {
			Episode: messages,
			StoryBook: msg.content,
			Rewards: result.rewards
		};
		
		await query("INSERT INTO Adventure (GameHash, UserId, GameId, Title, PlayerName, Result, LogId) VALUES (?, ?, ?, ?, ?, ?, ?)", [gameHash, result.UserId, 1, title, target.DisplayName, resNumber, logId]);
		await uploadToS3(logId, JSON.stringify(json));
		
		epic.deleteEpisode(gameHash, result.UserId);
		
		console.log("save episode:" + result.UserId);
	}
	
	deleteCachedUser(gameHash);
	
	console.log("complete message");
}

export async function createAdvTitle(gameId:number, users:any) {
	let gameInfo:any = getGameInfo(gameId)
	let rule:any = getAIRule("AdventureTitle_" + gameInfo.ProjectCode);
	if(!rule) {
		rule = getAIRule("AdventureTitle");
	}
	
	let prompt = rule.RuleText;
	if(gameId != 1) {
		prompt += `
# ゲームタイトル
${gameInfo.GameTitle}
		`;
	}
	
	prompt += `
# 難易度(10がふつう)
${gameInfo.Difficulty}

# 参加する冒険者
	`;
	
	if(users.length > 0) {
		for(let u of users) {
			prompt += `- ${u.Name} (${u.Job}) が参加。\nバックストーリー: {$u.Background}`;
		}
	}else{
		prompt += "冒険者はいない";
	}
	
	prompt += "#返送値(JSON)\n{ Title: [考えたタイトル] }";
	
	let json:any = await chat(prompt);
	json = JSON.parse(json.content);
	return json.Title;
}

//物語を記録
export function stockEpisode(gameHash: string, userId: number, data: any) {
	//
	let d: GameEpisode = new GameEpisode(data);
	epic.stockEpisode(gameHash, userId, d);
}

function cacheUser(gameHash: string, userInfo: any) {
	userCache[gameHash] = userInfo;
}

function getCachedUser(gameHash: string) {
	return userCache[gameHash];
}

function deleteCachedUser(gameHash: string) {
	delete userCache[gameHash];
}
