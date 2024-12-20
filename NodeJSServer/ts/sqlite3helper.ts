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


(async function() {
  await connect();
  await conn.exec("CREATE TABLE QuestSave ( \
    udid TEXT PRIMARY KEY, \
    questId INT NOT NULL, \
    userId INT NOT NULL, \
    progress INT NOT NULL DEFAULT 0, \
    reward INT NOT NULL DEFAULT 0, \
    updatedAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')), \
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')) \
  )");
  
  await conn.exec("CREATE TABLE User ( \
    id INTEGER PRIMARY KEY AUTOINCREMENT, \
    udid TEXT NOT NULL, \
    name TEXT NOT NULL, \
    rank INT NOT NULL DEFAULT 1, \
    money INT NOT NULL DEFAULT 0, \
    movePoint INT NOT NULL DEFAULT 30, \
    attackPoint INT NOT NULL DEFAULT 5, \
    lastPointUpdate TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')), \
    questTransaction TEXT DEFAULT NULL, \
    updatedAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')), \
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')) \
  )");
  
  await conn.exec("CREATE TABLE UserCards ( \
    id INTEGER PRIMARY KEY AUTOINCREMENT, \
    userId INT NOT NULL, \
    cardId INT NOT NULL, \
    level INT NOT NULL, \
    luck INT NOT NULL, \
    updatedAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')), \
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')) \
  )");
  
  await conn.exec("CREATE TABLE UserItems ( \
    id INTEGER PRIMARY KEY AUTOINCREMENT, \
    userId INT NOT NULL, \
    itemId INT NOT NULL, \
    amount INT NOT NULL, \
    updatedAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')), \
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')) \
  )");
  
  await conn.exec("CREATE TABLE UserQuests ( \
    id INTEGER PRIMARY KEY AUTOINCREMENT, \
    userId INT NOT NULL, \
    questId INT NOT NULL, \
    score INT NOT NULL, \
    clearFlag INT NOT NULL, \
    updatedAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')), \
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')) \
  )");
})();
