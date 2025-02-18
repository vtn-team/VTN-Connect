require('dotenv').config()
import { preloadUniqueUsers } from "../vclogic/vcuser"
import { loadMaster, loadMasterFromCache } from "../lib/masterDataCache"
import { createUser, gameAsk, getUser, gameHistory, userHistory, userMessage, friendList } from "../server/vc"

test("sample", async () => {
	let route:any = {
		query: {}
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
	let user = await getUser(null, null, { query:{ id: 1001 } });
	console.log(user);
	//TODO: userの型チェック
});


//TODO: 
//let user = await getUser(null, null, { query:{  } }); //queryつける
//let history = await gameHistory(null, null, { query:{  } });
//let uhis = await userHistory(null, null, { query:{  } });
//let um = await userMessage(null, null, { query:{  } });
//let friend = await friendList(null, null, { query:{  } });
//await gameAsk({ query:{  } }); //quetyの中身
