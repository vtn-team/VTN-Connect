//DBを選択
import { connect as dbConnect, execQuery } from "./dbmodule/mariadb";
//import { execQuery } from "./dbmodule/sqlite3";

export async function connect()
{
	try {
	 	await dbConnect();
	 }catch(ex){
	 	console.log(ex);
	 }
}

export async function query(query: string, values: any)
{
 	return await execQuery(query, values);
}