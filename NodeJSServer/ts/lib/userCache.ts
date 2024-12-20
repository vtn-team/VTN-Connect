const { v4: uuidv4 } = require('uuid')
import { getHash, setHash } from "./cachedb";

let cache:any = {};

export async function updateCache(uuid: string)
{
  let key:string = uuidv4();
  let token:string = uuidv4();
  key = key.replace(/-/g,"");
  token = token.replace(/-/g,"");
  
  //redisに登録
  await setHash(key, "udid", uuid);
  await setHash(key, "token", token);
  await setHash(key, "time", String((new Date()).getTime()));
  
  /*
  cache[key] = {
    udid: uuid,
    token: token,
    time: (new Date()).getTime()
  };
  */
  return key;
}

export async function updateData(key: string, dataKey: string, data: any)
{
  //if(!cache[key]) return false;
  
  await setHash(key, dataKey, data);
  
  //cache[key][dataKey] = data;
  return true;
}

export async function updateToken(key: string)
{
	if(!cache[key])
	{
		return "";
	}

	let token:string = uuidv4();
	token = token.replace(/-/g,"");

	await setHash(key, "token", token);
	await setHash(key, "time", String((new Date()).getTime()));

	//cache[key].token = token;
	//cache[key].time = (new Date()).getTime();
	return token;
}

export async function getCache(key: string)
{
	let data:any = await getHash(key);
	//stringで格納されているので、intのものは戻す
	for(let k in data)
	{
		if(isNaN(parseInt(data[k]))) continue;
		if(k == "udid") continue; //パースできるようなのでcontinue
		
		data[k] = parseInt(data[k]);
	}
	return data;
	/*
	if(key == "") return null;
	if(cache[key])
	{
		cache[key].time = (new Date()).getTime();
		return cache[key];
	}
	return null;
	*/
}

export async function setCache(key: string, vKey:string, value: any)
{
	await setHash(key, vKey, value)
	await setHash(key, "time", String((new Date()).getTime()));

	return getCache(key);
	
	/*
	if(!cache[key])
	{
		return ;
	}
	if(cache[key])
	{
		cache[vKey] = value;
		cache[key].time = (new Date()).getTime();
		return cache[key];
	}
	*/
}

//Redisの場合は必要ない
function cleanup()
{
	//TODO:
	console.log(cache);
}

//setInterval(cleanup, 7000);