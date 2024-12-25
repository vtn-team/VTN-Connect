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

//ユーザを作成する
export async function createUserWithAI() { //status: UserStatus
	let prompt = getAIRule("CreateUser");
	
	prompt += `
# 出力例(JSON)\n
{
	"FullName":$[キャラクターの本名],
	"DisplayName":$[キャラクターの表示名],
	"Gender":$[性別],
	"Age":$[年齢],
	"Job":$[職業],
	"Personality":$[性格],
	"Motivation":$[モチベーション],
	"Weaknesses":$[弱点],
	"Background":$[簡潔なバックストーリー]
};`;

	let userHash = uuidv4();
	let success = false;
	let result: any = {};
	
	try {
		let chatres:any = await chatWithSession(null, prompt);
		let json = JSON.parse(chatres.content);
		
		//threadIdと同期させる
		userHash = chatres.sessionId;
		
		//DBに保存
		let ins = await query("INSERT INTO User (UserHash, Type, Name) VALUES (?, 1, ?)", [userHash, json.FullName]);
		let userId = Number(ins.insertId);
		
		//let data = await query("SELECT Id FROM User WHERE UserHash = ?", [userHash]);
		//console.log(data);
		
		let status: Array<any> = [userId, json.DisplayName, 1, json.Gender, json.Age, json.Job, json.Personality, json.Motivation,json.Weaknesses, json.Background];
		query("INSERT INTO UserGameStatus (UserId, DisplayName, AvatarType, Gender, Age, Job, Personality, Motivation, Weaknesses, Background) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", status);
		
		result.userId = userId;
		result.userHash = userHash;
		result.Type = 1;	//NOTE: ハードコード
		result.Level = 1;	//NOTE: ハードコード
		result.Gold = 500;	//NOTE: ハードコード
		for(var k in json) {
			result[k] = json[k];
		}
		
		success = true;
	} catch(ex) {
		
	}
	
	return {
		success: success,
		result: result
	}
}
