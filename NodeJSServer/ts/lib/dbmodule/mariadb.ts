const mariadb = require('mariadb');
const pool = mariadb.createPool({host: "localhost", user: process.env.DB_USER, password: process.env.DB_PWD, connectionLimit: 5});
let conn: any = null;

async function connect()
{
  if(conn) return ;
  
  conn = await mariadb.createConnection({
      host: "localhost",
      user: process.env.DB_USER,
      password: process.env.DB_PWD,
      database: "vtn-game-sample"
      //timezone: 'Asia/Tokyo',
      //skipSetTimezone: true
  });
}

export async function execQuery(query: string, values: any)
{
  await connect();
  const res = await conn.query(query, values);
  return res;
}
