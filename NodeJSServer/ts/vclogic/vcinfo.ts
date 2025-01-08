import { query } from "./../lib/database"
const { v4: uuidv4 } = require('uuid')

//集積した情報
let currentInfo:any = {};


//ゲーム情報の更新
export async function updateMainGameInfo(gameInfo: any) {
	try {
		currentInfo.gameInfo = gameInfo;
		
		//DBに保存
		//let ins = await query("INSERT INTO User (UserHash, Type, Name) VALUES (?, 1, ?)", [userHash, json.FullName]);
	}catch(ex){
		console.log(ex);
	}
}


//情報の更新
export async function getInfo() {
	return currentInfo;
}
