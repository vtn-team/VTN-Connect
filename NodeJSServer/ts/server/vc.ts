import { getConnectionAddress, getActiveSessionNum } from "./../gameserver/server"
import { chatWithSession } from "./../lib/chatgpt"
import { query } from "./../lib/database"
import { getUniqueUsers, createUserWithAI, getUserFromId, getUserFromHash } from "./../vclogic/vcuser"
import { gameStartAIGame, gameEndAIGame, gameStartVC, gameEndVC } from "./../vclogic/vcgame"
import { uploadToS3 } from "./../lib/s3"
const { v4: uuidv4 } = require('uuid')

//デフォルト関数
export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

//接続アドレスの取得
export async function getaddr(req: any,res: any,route: any)
{
	let addrInfo = getConnectionAddress();
	if(addrInfo == null) {
		return {
			status: 200,
			address: ""
		};
	}
	
	let ret = `ws://${addrInfo.host}:${addrInfo.port}`;
	
	return {
		Status: 200,
		Address: ret
	};
}

//接続人数などを取得する
export async function stat(req: any,res: any,route: any)
{
	return {
		Status: 200,
		IsServerAlive: getConnectionAddress() != null,
		ActiveNum: getActiveSessionNum(),
	};
}

//ChatGPTと会話する
export async function chat(req: any,res: any,route: any)
{
	let threadHash = route.query.threadHash;
	let result = await chatWithSession(threadHash, route.query.prompt);
	
	return {
		Status: 200,
		Result: result
	};
}

//ユーザーを取得する
export async function getUser(req: any,res: any,route: any)
{
	let result = null;
	
	if(route.query.id) {
		result = await getUserFromId(route.query.id);
	}else{
		result = await getUserFromHash(route.query.hash);
	}
	
	return {
		Status: 200,
		UserData: result
	};
}

//4人ランダム取得
export async function getGameUsers(req: any,res: any,route: any)
{
	let player = await query("SELECT Id FROM User ORDER BY LastPlayedAt ASC LIMIT 0,?",[3]);
	let ids:Array<number> = [];
	let join:Array<string> = [];
	for(let d of player) {
		if(d.Id < 999) continue;
		ids.push(d.Id);
		join.push("?");
	}
	
	let results = [];
	if(ids.length > 0) {
		console.log(ids);
		console.log(join.join(','));
		results = await query("SELECT * FROM User INNER JOIN UserGameStatus ON User.Id = UserGameStatus.UserId WHERE Id IN ("+join.join(',')+");", ids);
		await query("UPDATE User SET LastPlayedAt = CURRENT_TIMESTAMP() WHERE Id IN ("+join.join(',')+");", ids);
	}
	
	results = results.concat(getUniqueUsers(4-ids.length));
	
	return {
		Status: 200,
		result: results
	};
}


//ユーザーを作成する
export async function createUser(req: any,res: any,route: any)
{
	let result = await createUserWithAI();
	
	return {
		Status: 200,
		Success: result.success,
		UserData: result.result
	};
}

//AIゲーム開始
export async function gameStartAI(req: any,res: any,route: any)
{
	let result:any = await gameStartAIGame(route.query.Option);
	
	result.Status = 200;
	
	return result;
}

//ゲーム終了
export async function gameEndAI(req: any,res: any,route: any)
{
	let result:any = await gameEndAIGame(route.query);
	
	result.Status = 200;
	
	return result;
}

//ゲーム開始
export async function gameStart(req: any,res: any,route: any)
{
	let result:any = await gameStartVC(route.query.GameId, route.query.UserId, route.query.Option);
	
	result.Status = 200;
	
	return result;
}

//ゲーム終了
export async function gameEnd(req: any,res: any,route: any)
{
	let result:any = await gameEndVC(route.query.GameHash, route.query.GameResult);
	
	result.Status = 200;
	
	return result;
}

//冒険の書を作る
export async function epictest(req: any,res: any,route: any)
{
let msg = {
  role: 'assistant',
  content: `## 雷霆 神楽の冒険
    ### 冒険の始まり
    雷霆神楽は、生まれ育った村の守護者としての役割を果たすため、日々修行に励んでいた。今日は特に重要な任務が待っていた 。村の周辺で悪名高い盗賊団が活動しているとの情報が入り、神楽は仲間の冒険者たちと共に、その討伐に向かうことになった。
    
    ### 冒険の展開
    神楽は仲間とともに、盗賊団が潜んでいると思われる森へと向かった。途中、神楽の無鉄砲な性格が災いし、仲間との連携を崩 してしまう場面が多々あった。彼女は、敵の位置を特定するための計画を立てるのが苦手で、思いつきで行動してしまうことが多かった。しかし、村の人々を守るために強くなりたいという強い思いが、彼女を鼓舞していた。
    
    ### 戦闘と取り逃がし
    ついに盗賊団との遭遇が果たされた。神楽は勇敢に敵のリーダーに立ち向かい、仲間たちも自分の持ち場を守るために奮闘した 。しかし、戦闘の最中に神楽は敵が逃げるのを見逃し、彼女の判断ミスから敵を取り逃がしてしまった。敵の一団は、逃げた位置（16.00, -20.46, -1.00）で regroupし、すぐに村への逆襲を敢行することとなった。
    
    ### 結果としての失敗
    盗賊団が村に戻り、一般人を狙った略奪を始めた。神楽の仲間たちは、村を守るために急いで帰還したが、取り逃がした敵の数 に応じて、村に不安と混乱をもたらしてしまった。村の人々は恐怖におののき、神楽への信頼も揺らいでしまう。彼女は、村を守りたい一心で行動したが、その結果、多くの人々が危険な目に遭うこととなった。神楽は自分の無鉄砲さを悔い、次の冒険に生かす教訓を得ることになった。
    
    ### 冒険の結末
    この冒険を通じて、神楽は計画性と仲間との連携の重要性を強く認識することとなった。失敗を経て、彼女はさらに成長する意 志を強める。村人たちを守るため、今後は冷静な判断を心がけることを誓った。しかし、失敗の代償は大きく、彼女は次の機会により一層真剣に臨むことを決意した。
`,
  refusal: null
};
	
	let gameHash = uuidv4();
	await uploadToS3(gameHash, msg.content);
/*
	gameId: number, userId: number) {
	await 
	createEpisode(gameId, )
*/
}

