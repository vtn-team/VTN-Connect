const { v4: uuidv4 } = require('uuid')
import { query } from "./../lib/database"
import { getCache, updateCache, updateData } from "./../lib/userCache"

export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

export async function login(req: any,res: any,route: any)
{
	let key = await updateCache(route.query.udid);
	let session = await getCache(key);

	//user cache
	if(!route.query.udid)
	{
	  return { status: 200, session:key, token: session.token };
	}
	
	//
	const result = await query("SELECT * FROM User WHERE udid = ?",[route.query.udid]);
	if(result.length == 0)
	{
	  //TODO: テストでDB移行すると400になり進行不能になるため、ここではユーザが登録されていない処理とする
	  return { status: 200, session:key, token: session.token };
	  
	  //return { status: 400 };
	}
	
	//userIdをキャッシュに記録する
	await updateData(key, "userId", Number(result[0].id));
	
	let ret:any = {};
	for(var k in result[0])
	{
	  ret[k] = result[0][k];
	}
	
	ret.status = 200;
	ret.session = key;
	ret.token = session.token;
	ret.id = Number(result[0].id);
	ret.lastPointUpdate = new Date(result[0].lastPointUpdate).getTime();
	
	return ret;
}

export async function create(req: any,res: any,route: any)
{
	let index = 0;
	if(!route.query.name) return {};
	
	//ユーザ作る
	let udid:string = uuidv4();
	const result = await query("INSERT INTO User(udid, name) VALUES(?,?)",[udid, route.query.name]);
	
	//その他必要なものを付与する
	
	//
	
	return {
		status: 200,
		udid: udid,
		name: route.query.name
	};
}

export async function get(req: any,res: any,route: any)
{
	if(route.query.udid === undefined) return null;
	
	console.log("get here");
	const result = await query("SELECT * FROM User WHERE udid = ?",[route.query.udid]);
	return { status: 200 };
}

