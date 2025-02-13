require('dotenv').config()
const fs = require('fs');

let mCache:any = {};
let mDicCache:any = {};
let versionInfo:any = {};

let masterFiles = ["GameInfo", "GameEvent", "AIRule", "SakuraEvent", "Level", "QRSheet", "QREvent"];
const sheetUri = "https://script.google.com/macros/s/AKfycbyz1bYamLTqUP_RY6uVGyaUKs-DV_ey7awWuMzsxLN86yY79kTq3OuqhflwvXBlXoU-GQ/exec";
//"https://script.google.com/macros/s/AKfycbwxrmXMYPwuDnCTugeCQ3XYUeNv54FeFQG7h_nPmnQBj7zDj_qRibqklzxZPu__NydlSQ/exec";

async function getSheetJson(sheet: string)
{
	const res = await fetch(`${sheetUri}?sheet=${sheet}`, {method: 'GET'});
	const text = await res.text();
	
	var json = JSON.parse(text);
	mCache[sheet] = json.Data;
	versionInfo[sheet] = json.Version;
	console.log("load master:" + sheet);

	fs.writeFileSync(`json/${sheet}.json`, text);
}

async function getSheetJsonFromCache(sheet: string)
{
	const text = fs.readFileSync(`json/${sheet}.json`);
	var json = JSON.parse(text);
	mCache[sheet] = json.Data;
	versionInfo[sheet] = json.Version;
	console.log("load master:" + sheet);
}

//IDをキーにした辞書配列にする
function createDicMaster(sheet: string, keyString: string = "Id")
{
	mDicCache[sheet] = {};
	
	var master = getMaster(sheet);
	for(let d of master)
	{
		mDicCache[sheet][d[keyString]] = d;
	}
}

//特定のIDをキーにした辞書配列にし、同じキーを持つレコードをまとめて配列で返す
function createDicGroupListMaster(sheet: string, keyString: string = "Id")
{
	mDicCache[sheet] = {};
	
	var master = getMaster(sheet);
	for(let d of master)
	{
		if(mDicCache[sheet][d[keyString]] == undefined) mDicCache[sheet][d[keyString]] = [];
		
		mDicCache[sheet][d[keyString]].push(d);
	}
}

export async function loadMaster()
{
	let requests = [];
	for(let m of masterFiles)
	{
		requests.push(getSheetJson(m));
	}
	await Promise.all(requests);
	constructDicMaster();
}

export async function loadMasterFromCache()
{
	let requests = [];
    for(let m of masterFiles)
    {
            requests.push(getSheetJsonFromCache(m));
    }
    await Promise.all(requests);
	constructDicMaster();
}

//索引用の辞書配列を作る
function constructDicMaster()
{
	//文字列になっている数字をNumberに成型する
	for(let mKey in mCache)
	{
		for(let d of mCache[mKey])
		{
			for(let k in d)
			{
				if(k.endsWith("At")) continue;
				
				if(!isNaN(parseInt(d[k])))
				{
					d[k] = parseInt(d[k]);
				}
			}
		}
	}
	
	createDicMaster("GameInfo");
	createDicMaster("GameEvent");
	createDicMaster("SakuraEvent");
	createDicMaster("QRSheet", "UUID");
	createDicMaster("QREvent");
	createDicMaster("Level", "Level");
	createDicMaster("AIRule", "RuleId");
}

export function getMaster(sheet: string)
{
	return mCache[sheet];
}

export function getGameInfo(id: number)
{
	return mDicCache["GameInfo"][id];
}

export function getGameEvent(id: number)
{
	return mDicCache["GameEvent"][id];
}

export function getAIRule(ruleId: string)
{
	return mDicCache["AIRule"][ruleId];
}

export function getLevel(lv: number)
{
	return mDicCache["Level"][lv];
}

export function getQRSheet(uuid: string)
{
	return mDicCache["QRSheet"][uuid];
}

export function getQREvent(id: number)
{
	return mDicCache["QREvent"][id];
}

export function getSakuraEvent(ruleKey: string)
{
	return mDicCache["SakuraEvent"][ruleKey];
}

export function getVersionInfo()
{
	return versionInfo;
}

