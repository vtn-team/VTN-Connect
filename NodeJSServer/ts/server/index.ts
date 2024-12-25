export async function index(req: any,res: any,route: any)
{
	console.log(route);
	return null;
}

export async function route(req: any,res: any,route: any)
{
	const Route = require("./../apiRoute");
	return Route.Routes; //JSON.stringify(Route.Routes, null, 2);
}
