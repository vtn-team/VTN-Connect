import { getMaster, getGameInfo, getGameEvent, getAIRule } from "../lib/masterDataCache"
import { sendAPIEvent, startRecord, stopRecord } from "../gameserver/server"
import { chatWithContextsText } from "./../lib/chatgpt"
import { uploadToS3 } from "./../lib/s3"
const { v4: uuidv4 } = require('uuid')

interface Episode {
	getEpisodePrompt(userInfo: any) : any;
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
	episodes: Array<Episode>

	constructor(gameId: number, gameHash: string, userInfo: any) {
		this.gameId = gameId;
		this.gameHash = gameHash;
		this.userInfo = userInfo;
		this.episodes = [
			new CharacterSetting(gameId),
			new GameStart(gameId),
		];
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
	
	public createEpisode(gameId: number, gameHash: string, userInfo: any) {
		this.books[gameHash] = new EpisodeBook(gameId, gameHash, userInfo);
	}
	
	public getGameId(gameHash: string) {
		if(!this.books[gameHash]) return 0;
		return this.books[gameHash].getGameId();
	}
	
	public stockEpisode(gameHash: string, data: GameEpisode) {
		if(!this.books[gameHash]) {
			return ;
		}
		
		this.books[gameHash].stockEpisode(data);
	}
	
	public deleteEpisode(gameHash: string) {
		delete this.books[gameHash];
	}
	
	public getEpisodePrompt(gameHash: string) {
		if(!this.books[gameHash]) return null;
		return this.books[gameHash].getEpisodePrompt();
	}
};

let epic = new Epic();

//
export function createEpisode(gameId: number, gameHash: string, userInfo: any) {
	//
	epic.createEpisode(gameId, gameHash, userInfo);
	console.log("create episode");
}

//
export function stockEpisode(gameHash: string, data: any) {
	//
	let d: GameEpisode = new GameEpisode(data);
	epic.stockEpisode(gameHash, d);
}

//
export async function saveEpisode(gameHash: string, gameResult: boolean) {
	//
	let messages = epic.getEpisodePrompt(gameHash);
	if(!messages) return;
	
	console.log("save episode");
	
	let master = getGameInfo(epic.getGameId(gameHash));
	
	let rule = getAIRule("CreateEpic_" + master.ProjectCode);
	if(!rule) rule = getAIRule("CreateEpic");
	let prompt = rule.RuleText;
	if(gameResult) {
		prompt += "\n\n# 冒険の結末\n- 成功";
	}else{
		prompt += "\n\n# 冒険の結末\n- 失敗";
	}
	messages.push({ role: "user", content: prompt });
	console.log(messages);
	
	let msg:any = await chatWithContextsText(messages);
	console.log(msg);
	
	epic.deleteEpisode(gameHash);
	
	await uploadToS3(gameHash, msg.content);
	
	console.log("complete message");
}
