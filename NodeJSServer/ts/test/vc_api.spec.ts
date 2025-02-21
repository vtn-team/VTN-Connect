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

// ユーザー取得 テスト
test("ユーザー取得 Id 型チェック", async () => {
  let user = await getUser(null, null, { query: { id: 1030 } });

  expect(user.Status).toBe(200);

  expect(user).toMatchObject({
    UserData: expect.objectContaining({
      Id: expect.any(Number),
      UserHash: expect.any(String),
      Type: expect.any(Number),
      Name: expect.any(String),
      Level: expect.any(Number),
      Exp: expect.any(Number),
      Karma: expect.any(Number),
      Gold: expect.any(Number),
      PlayCount: expect.any(Number),
      CreatedAt: expect.any(Date),
      LastPlayedAt: expect.any(Date),
      UserId: expect.any(Number),
      DisplayName: expect.any(String),
      AvatarType: expect.any(Number),
      Gender: expect.any(String),
      Age: expect.any(String),
      Job: expect.any(String),
      Personality: expect.any(String),
      Motivation: expect.any(String),
      Weaknesses: expect.any(String),
      Background: expect.any(String),
    }),
  });
  // console.log(user);
});
test("ユーザー取得 Hash 型チェック", async () => {
  let user = await getUser(null, null, { query: { hash: "423c1220-c2cf-11ef-8d4f-0ea32b56e377" } });

  expect(user.Status).toBe(200);

  expect(user).toMatchObject({
    UserData: expect.objectContaining({
      Id: expect.any(Number),
      UserHash: expect.any(String),
      Type: expect.any(Number),
      Name: expect.any(String),
      Level: expect.any(Number),
      Exp: expect.any(Number),
      Karma: expect.any(Number),
      Gold: expect.any(Number),
      PlayCount: expect.any(Number),
      CreatedAt: expect.any(Date),
      LastPlayedAt: expect.any(Date),
      UserId: expect.any(Number),
      DisplayName: expect.any(String),
      AvatarType: expect.any(Number),
      Gender: expect.any(String),
      Age: expect.any(String),
      Job: expect.any(String),
      Personality: expect.any(String),
      Motivation: expect.any(String),
      Weaknesses: expect.any(String),
      Background: expect.any(String),
    }),
  });
  // console.log(user);
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
  // console.log(uhis);
});
test("UserId30のユーザー(カズマ)の参加したゲームの情報取得 型チェック", async () => {
  let uhis = await userHistory(null, null, { query: { id: 30 } });

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
  // console.log(uhis);
});

// 応援メッセージ取得 テスト
test("送信された応援メッセージ取得(webから送信されたid) 型チェック", async () => {
  let um = await userMessage(null, null, { query: { id: -1 } });

  expect(um).toMatchObject({
    Messages: expect.arrayContaining([
      expect.objectContaining({
        Id: expect.any(Number),
        ToUserId: expect.any(Number),
        FromUserId: expect.any(Number),
        AvatarType: expect.any(Number),
        Message: expect.any(String),
        Emotion: expect.any(Number),
        CreatedAt: expect.any(Date),
      }),
    ]),
    Count: expect.any(Number),
  });

  expect(um.Status).toBe(200);
  //console.log(um);
});
test("送信された応援メッセージ取得 型チェック", async () => {
  let um = await userMessage(null, null, { query: { id: 1094 } });

  expect(um).toMatchObject({
    Messages: expect.arrayContaining([
      expect.objectContaining({
        Id: expect.any(Number),
        ToUserId: expect.any(Number),
        FromUserId: expect.any(Number),
        AvatarType: expect.any(Number),
        Message: expect.any(String),
        Emotion: expect.any(Number),
        CreatedAt: expect.any(Date),
      }),
    ]),
    Count: expect.any(Number),
  });

  expect(um.Status).toBe(200);
  //console.log(um);
});

// 出会いの記録取得 テスト
test("出会いの記録取得 型チェック", async () => {
  let friend = await friendList(null, null, { query: { id: 1 } });
  //TODO: friendListの戻り値が他の関数とちょっと違うので、要確認
  expect(friend.Friends).toMatchObject({
    Friends: expect.arrayContaining([
      expect.objectContaining({
        UserId: expect.any(Number),
        FriendId: expect.any(Number),
        FriendName: expect.any(String),
        EventId: expect.any(Number),
        EnCount: expect.any(Number),
        Option: expect.any(String),
        CreatedAt: expect.any(Date),
      }),
    ]),
    Count: expect.any(Number),
  });

  expect(friend.Status).toBe(200);
  //console.log(friend);
});

// ゲームアンケート作成及び取得 テスト
test("アンケート作成 ", async () => {
  let ask = await gameAsk(null, null, { query: {} }); //quetyの中身
  // TODO: データがAPI経由で正常に作成できるかをテストする
});
