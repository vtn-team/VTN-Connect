//DBを選択
import { execQuery } from "./dbmodule/mariadb";
//import { execQuery } from "./dbmodule/sqlite3";

export async function query(query: string, values: any)
{
  return await execQuery(query, values);
}