import { loadMaster, getMaster } from "./../lib/masterDataCache"


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

export async function getmaster(req: any,res: any,route: any)
{
	let master:any = getMaster(route.query.name);
	
	return {
		status: 200,
		Master: master
	};
}
