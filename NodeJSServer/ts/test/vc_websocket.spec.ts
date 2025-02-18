require('dotenv').config()
import { TestAIGameClient } from "./testClient"
import { loadMaster, loadMasterFromCache } from "../lib/masterDataCache"
import { preloadUniqueUsers, getUniqueUsers, createUserWithAI, getUserFromId, getUserFromHash, getUserHistory, getUserMessages, getUserFriends, gameAskAndReward } from "./../vclogic/vcuser";
import { gameStartAIGame, gameEndAIGame, gameStartVC, gameEndVC, getGameHistory, getGameSessions, getGameUserCache, gameHandOver, setArtifactDebug } from "./../vclogic/vcgame"

let aigame:any = null;

test("websocket launch", async () => {
	//準備
	await loadMasterFromCache();
	await preloadUniqueUsers();
	
	//ゲームAPIのテスト
	aigame = new TestAIGameClient();
	//console.log("OK");
});

test("game start", async () => {
	let result = await aigame.gameStart();
	//console.log(result);
	expect(result.Success).toBe(true);
});

test("get user", async () => {
	let player = getGameUserCache(1);
	console.log(player);
});

test("game end", async () => {
	let result = await aigame.gameEnd();
	//console.log(result);
	expect(result.Success).toBe(true);
});
