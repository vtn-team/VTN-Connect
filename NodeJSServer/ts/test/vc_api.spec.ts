require('dotenv').config()
import { TestAIGameClient } from "./testClient"
import { createUser, gameAsk, getUser, gameHistory, userHistory, userMessage, friendList } from "../server/vc"

test("sample", async () => {
	let route:any = {
		query: {}
	};
	
	//TODO: 
	//await createUser({ query:{  } }); //quetyの中身
	console.log("OK");
});

test("getUser by id", async () => {
	let user = await getUser(null, null, { query:{ id: 1001 } });
	console.log(user);
	//TODO: userの型チェック
});

/*
(async function() {
	
	//取得系APIのテスト
	let user = await getUser(null, null, { query:{ id: 1001 } });
	//let user = await getUser(null, null, { query:{  } }); //queryつける
	
	//TODO: 
	//let history = await gameHistory(null, null, { query:{  } });
	//let uhis = await userHistory(null, null, { query:{  } });
	//let um = await userMessage(null, null, { query:{  } });
	//let friend = await friendList(null, null, { query:{  } });
	
	
	//ゲームAPIのテスト
	let aigame = new TestAIGameClient();
	await aigame.gameStart();
	
	//APIテスト
	await getGameUsers(null, null, { query:{  } });
	//
	await aigame.gameEnd();
	//
	
	
	
	//TODO: 
	//await gameAsk({ query:{  } }); //quetyの中身
})();
*/