import { chatWithSession } from "./../lib/chatgpt"
import { getAIRule } from "./../lib/masterDataCache"
import { query } from "./../lib/database"
const { v4: uuidv4 } = require('uuid')

let userSession:any = {};
let uniqueUsers:any = [];

/*
export class UserStatus {
	public Name:string;
	public PromptA :string;
	public PromptB:string;
	public PromptC:string;
	public PromptD:string;
}
*/

//ユニークユーザをあっためておく
export async function preloadUniqueUsers() {
	let result = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id < ?",[999]);
	uniqueUsers = result;
	//console.log(uniqueUsers);
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

async function createUserFromChatGPT(sessionId:string|null) {
	let prompt = getAIRule("CreateUser").RuleText;
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
export async function createUserWithAI() { //status: UserStatus
	let userHash = uuidv4();
	let success = false;
	let result: any = {};
	
	try {
		let json:any = {};
		let session:string|null = null;
		for(let i=0; i<5; ++i) {
			let data:any = await createUserFromChatGPT(session);
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
		
		result.UserId = userId;
		result.UserHash = userHash;
		result.Type = 1;	//NOTE: ハードコード
		result.Level = 1;	//NOTE: ハードコード
		result.Gold = 500;	//NOTE: ハードコード
		for(var k in json) {
			result[k] = json[k];
		}
		
		success = true;
	} catch(ex) {
		console.log(ex);
	}
	
	return {
		success: success,
		result: result
	}
}
