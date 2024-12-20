import { query } from "./../lib/database"
import { getVersionInfo } from "./../lib/masterDataCache"

export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

export async function check(req: any,res: any,route: any)
{
	let msVers = [];
	let verInfo = getVersionInfo();
	for(let m in verInfo)
	{
		msVers.push({ masterName:m, version: verInfo[m] });
	}
	return { 
		status: 200,
		isMaintenance: false,
		contentCatalog: "",
		masterVersion: msVers
	};
}


