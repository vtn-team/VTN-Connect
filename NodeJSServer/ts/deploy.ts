require('dotenv').config()
const fs = require("fs");
const cry = require("crypto");
const Files = require('./masterFiles').Files;

const sheetUri = "https://script.google.com/macros/s/AKfycbwGUM7P5wYv1wW9YGmYR4Uxhotg0aF84Qq3EUA9x6sJHtoqREyw1BKtsWydTpySI9hu/exec";
let fileList: Array<any> = [];

async function getSheetJson(sheet: string) {
	const res = await fetch(`${sheetUri}?sheet=${sheet}`, {method: 'GET'});
	const text = await res.text();
	const file = `${sheet}.json`;
	fs.writeFileSync(file, text);
};

function getFileInfo(sheet: string) {
	const file = `${sheet}.json`;
	var stat = fs.statSync(file);
	const md5hash = cry.createHash('md5');
	const text = fs.readFileSync(file);
    md5hash.update(text);
    
    var json = JSON.parse(text);
    
	fileList.push({
		Name: file,
		Size: stat.size,
		CRC: md5hash.digest("hex"),
		Version: json.Version
	});
};

(async function() {
	//await getSheetJson("Cube");
	//await getSheetJson("Effect");
	//await getSheetJson("JP_Text");
	//await getSheetJson("EN_Text");
	
	getFileInfo("Cube");
	getFileInfo("Effect");
	getFileInfo("JP_Text");
	getFileInfo("EN_Text");
	
	fs.writeFileSync("masterFileInfo.json", JSON.stringify(fileList, null, 2));
})();