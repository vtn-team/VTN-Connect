import { getConnectionAddress, getActiveSessionNum } from "./../gameserver/server"

export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

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

export async function stat(req: any,res: any,route: any)
{
	return {
		status: 200,
		isServerAlive: getConnectionAddress() != null,
		activeNum: getActiveSessionNum(),
	};
}

