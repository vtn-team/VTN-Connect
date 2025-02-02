import { loadMaster } from "./../lib/masterDataCache"
import { modelList, getEphemeralKey } from "./../lib/chatgpt"

export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

export async function masterupdate(req: any,res: any,route: any)
{
	await loadMaster();
	
	return {
		status: 200
	};
}


//AIモデル一覧
export async function modelist(req: any,res: any,route: any)
{
	let result:any = await modelList();
	
	result.Status = 200;
	
	return result;
}


//AIトークン取得
export async function realtimeai(req: any,res: any,route: any)
{
	let result:any = await getEphemeralKey(route.query.Instructions);
	
	result.Status = 200;
	
	return {
		Status: 200,
		SessionId: result.id,
		EphemeralKey: result.client_secret.value,
		KeyExpiresAt: result.client_secret.expires_at,
		Object: result
	};
}
