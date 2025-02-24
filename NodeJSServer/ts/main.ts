require('dotenv').config()
import { launch } from "./server"
import { findElasticIP } from "./elasticip"
import { launchDGS, ServerType } from "./gameserver/server"
import { connect } from "./lib/database"
import { HTTP_SERVER_PORT, GAME_SERVER_PORT, USER_PORTAL_PORT } from "./config/config"
import { loadMaster, loadMasterFromCache } from "./lib/masterDataCache"
import { preloadUniqueUsers } from "./vclogic/vcuser"

(async function() {
	//起動引数を処理する
	let flags = [];
	if(process.argv.length >= 2){
		for(let i=2; i<process.argv.length; ++i){
			flags.push(process.argv[i].trim());
		}
	}
	
	//マスタ参照
	if(flags.indexOf("--useCache") != -1) {
		await loadMasterFromCache();
	}else{
		await loadMaster();
	}
	
	//DBウォームアップ
	await connect();
	
	//await loadInformation();
	
	//自分のIPを取得する
	findElasticIP();
	
	//ユニークユーザの準備
	await preloadUniqueUsers();
	
	if(flags.indexOf("--gameServer") != -1) {
		//HTTPサーバ起動
		launch(HTTP_SERVER_PORT);
	}
	
	if(flags.indexOf("--gameServer") != -1 && flags.indexOf("--userPortal") != -1) {
		//ゲームサーバ起動
		launchDGS(ServerType.Both, GAME_SERVER_PORT);
	}
	
	if(flags.indexOf("--gameServer") != -1) {
		//ゲームサーバ起動
		launchDGS(ServerType.GameConnect, GAME_SERVER_PORT);
	}
	
	if(flags.indexOf("--userPortal") != -1) {
		//ゲームサーバ起動
		launchDGS(ServerType.UserPortal, USER_PORTAL_PORT);
	}
})();
