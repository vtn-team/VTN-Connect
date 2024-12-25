import { getConnectionAddress, getActiveSessionNum } from "./../gameserver/server"
import { chatWithSession } from "./../lib/chatgpt"
import { createUserWithAI } from "./../vclogic/vcuser"

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
		status: 200,
		address: ret
	};
}

//接続人数などを取得する
export async function stat(req: any,res: any,route: any)
{
	return {
		status: 200,
		isServerAlive: getConnectionAddress() != null,
		activeNum: getActiveSessionNum(),
	};
}

//ChatGPTと会話する
export async function chat(req: any,res: any,route: any)
{
	let threadHash = route.query.threadHash;
	let result = await chatWithSession(threadHash, route.query.prompt);
	
	return {
		status: 200,
		result: result
	};
}

//ユーザーを作成する
export async function createUser(req: any,res: any,route: any)
{
	let result = await createUserWithAI();
	
	return {
		status: 200,
		success: result.success,
		result: result.result
	};
}
