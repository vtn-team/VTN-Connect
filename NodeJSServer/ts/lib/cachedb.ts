//キャッシュはRedis以外選択肢があまりないのでRedisで固定
import { createClient } from 'redis';
let client: any = null;

async function connect()
{
	if(client) return ;

	client = createClient();
	client.on('error', function(err: any)  {
		console.log('Redis Client Error', err)
	});
	await client.connect();
}

export async function set(key: string, value: string)
{
	await connect();
	await client.set(key, value);
}

export async function get(key: string)
{
	await connect();
	return await client.get(key);
}

export async function setHash(key: string, field: string, value: string)
{
	await connect();
	await client.hSet(key, field, value);
}

export async function getHash(key: string)
{
	await connect();
	return await client.hGetAll(key);
}
