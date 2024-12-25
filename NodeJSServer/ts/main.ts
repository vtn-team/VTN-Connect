require('dotenv').config()
import { launch } from "./server"
import { findElasticIP } from "./elasticip"
import { launchDGS } from "./gameserver/server"
import { createUserWithAI } from "./vclogic/vcuser"
import { connect } from "./lib/database"
import { loadMaster, loadMasterFromCache } from "./lib/masterDataCache"
import { loadInformation, loadInformationFromCache } from "./lib/InformationCache"

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
	
	//HTTPサーバ起動
	launch();
	
	//ゲームサーバ起動
	launchDGS(3788);
})();
