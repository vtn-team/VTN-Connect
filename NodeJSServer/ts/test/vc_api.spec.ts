require("dotenv").config();
import { preloadUniqueUsers } from "../vclogic/vcuser";
import { loadMaster, loadMasterFromCache } from "../lib/masterDataCache";
import { createUser, gameAsk, getUser, gameHistory, userHistory, userMessage, friendList } from "../server/vc";

test("sample", async () => {
  let route: any = {
    query: {},
  };

  //TODO:
  //await createUser({ query:{  } }); //quetyの中身
  console.log("OK");
});

test("apitest launch", async () => {
  //準備
  await loadMasterFromCache();
  await preloadUniqueUsers();
  //console.log("OK");
});

test("getUser by id", async () => {
  let user = await getUser(null, null, { query: { id: 1001 } });
  console.log(user);
  //TODO: userの型チェック
});

// 過去のゲーム取得 テスト
test("過去全てのゲーム取得 型チェック", async () => {
  let history = await gameHistory(null, null, { query: { id: 0 } });

  expect(history).toMatchObject({
    History: expect.arrayContaining([
      expect.objectContaining({
        GameHash: expect.any(String),
        UserId: expect.any(Number),
        GameId: expect.any(Number),
        Title: expect.any(String),
        PlayerName: expect.any(String),
        Result: expect.any(Number),
        LogId: expect.any(String),
        CreatedAt: expect.any(Date),
      }),
    ]),
    Count: expect.any(Number),
  });

  expect(history.Status).toBe(200);
  //console.log(history);
});
test("過去全てのゲーム取得 ページ2 型チェック", async () => {
  let history = await gameHistory(null, null, { query: { id: 0, page: 2 } });

  expect(history).toMatchObject({
    History: expect.arrayContaining([
      expect.objectContaining({
        GameHash: expect.any(String),
        UserId: expect.any(Number),
        GameId: expect.any(Number),
        Title: expect.any(String),
        PlayerName: expect.any(String),
        Result: expect.any(Number),
        LogId: expect.any(String),
        CreatedAt: expect.any(Date),
      }),
    ]),
    Count: expect.any(Number),
  });

  expect(history.Status).toBe(200);
  //console.log(history);
});
test("過去のGameId 1のゲーム 型チェック", async () => {
  let history = await gameHistory(null, null, { query: { id: 1 } });

  expect(history).toMatchObject({
    History: expect.arrayContaining([
      expect.objectContaining({
        GameHash: expect.any(String),
        UserId: expect.any(Number),
        GameId: expect.any(Number),
        Title: expect.any(String),
        PlayerName: expect.any(String),
        Result: expect.any(Number),
        LogId: expect.any(String),
        CreatedAt: expect.any(Date),
      }),
    ]),
    Count: expect.any(Number),
  });

  expect(history.Status).toBe(200);
  // console.log(history);
});

// 過去のゲーム参加ユーザー取得 テスト
test("UserId2のユーザー(マルオ)の参加したゲームの情報取得 型チェック", async () => {
  let uhis = await userHistory(null, null, { query: { id: 2 } });

  expect(uhis).toMatchObject({
    History: expect.arrayContaining([
      expect.objectContaining({
        GameHash: expect.any(String),
        UserId: expect.any(Number),
        GameId: expect.any(Number),
        Title: expect.any(String),
        PlayerName: expect.any(String),
        Result: expect.any(Number),
        LogId: expect.any(String),
        CreatedAt: expect.any(Date),
      }),
    ]),
    Count: expect.any(Number),
  });

  expect(uhis.Status).toBe(200);
  console.log(uhis);
});

//TODO:
//let user = await getUser(null, null, { query:{  } }); //queryつける
//let um = await userMessage(null, null, { query:{  } });
//let friend = await friendList(null, null, { query:{  } });
//await gameAsk({ query:{  } }); //quetyの中身
