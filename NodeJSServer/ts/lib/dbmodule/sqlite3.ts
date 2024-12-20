import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

let conn: any = null;

async function connect()
{
  if(conn) return ;
  
  // open the database
  conn = await open({
      filename: './vtn-game.db',
      driver: sqlite3.Database
  });
}

export async function execQuery(query: string, values: any)
{
  await connect();
  
  //
  query = query.replace("now()", "(DATETIME('now', 'localtime'))");
  
  if(query.indexOf("SELECT") != -1)
  {
    let res = await conn.all(query, values);
    
    //mariadb互換性のための処理
    if(res == undefined)
    {
      res = [];
    }
    //
    
    return res;
  }
  else
  {
    const res = await conn.run(query, values);
    
    //mariadb互換性のための処理
    if(query.indexOf("INSERT") != -1)
    {
      res.insertId = res.lastID;
    }
    //
    
    console.log(res);
    return res;
  }
}

