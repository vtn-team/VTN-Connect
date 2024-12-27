import { DATABASE_HOST, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_SELECT } from "./../../config/config"

const mariadb = require('mariadb');

const pool = mariadb.createPool({
	host: DATABASE_HOST, 
	user: DATABASE_USERNAME, 
	password: DATABASE_PASSWORD, 
	database: DATABASE_SELECT,
	connectionLimit: 5
});

let conn: any = null;

export async function connect()
{
	if(conn && conn.isValid()) return ;

	conn = await pool.getConnection();
	return;
	let cnInfo = {
		host: DATABASE_HOST,
		user: DATABASE_USERNAME,
		password: DATABASE_PASSWORD,
		database: DATABASE_SELECT
		//timezone: 'Asia/Tokyo',
		//skipSetTimezone: true
	};
	console.log(cnInfo);
	conn = await mariadb.createConnection(cnInfo);
}

export async function execQuery(query: string, values: any)
{
	await connect();
	const res = await conn.query(query, values);
	return res;
}
