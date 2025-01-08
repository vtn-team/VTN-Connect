import { updateMainGameInfo } from "./vcinfo"
import { getUniqueUsers } from "./vcuser"
import { query } from "./../lib/database"
const { v4: uuidv4 } = require('uuid')

//ゲーム情報構造体

//AIゲーム開始
//NOTE: 誰を使うかはサーバが決定する
export async function gameStartAIGame() {
	let result = {
		Success: false,
		GameHash: "",
		GameUsers: [],
		GameInfo: []
	};
	
	try {
		let gameHash = uuidv4();
		let users = await choiseAIGameUsers();
		let gameId = 1; //NOTE: ハードコードで良くないが良い手段がない
		
		//DBに保存
		
		//Gameにプレイ開始したゲームの情報を記録
		await query("INSERT INTO Game (GameHash, GameId, State) VALUES (?, ?, 1)", [gameHash, gameId]);
		
		//Adventureにプレイしたユーザの情報を記録
		for(let u of users) {
			await query("INSERT INTO Adventure (GameHash, UserId) VALUES (?, ?)", [gameHash, u.Id]);
		}
		
		result.Success = true;
		result.GameHash = gameHash;
		result.GameUsers = users;
		//result.info //TBD
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}

//ゲーム開始
export async function gameStartVC(userHash: string) {
	let result = {
		Success: false,
	};
	
	try {
		result.Success = true;
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}


//ゲーム終了
export async function gameEndVC(gameResult: any) {
	let result = {
		Success: false,
	};
	
	try {
		result.Success = true;
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}

async function choiseAIGameUsers() {
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
