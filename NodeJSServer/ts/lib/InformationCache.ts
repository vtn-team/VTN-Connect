require('dotenv').config()
import { getConfig, getContents } from "./notion"
const { setTimeout } = require('timers/promises');
const fs = require('fs');

const masterDB: string = "f8700577c36c43b989da2fa77174e040";

let infoCache:any = {};
let infoList:any = [];


function convertToInformationBlock(block: any)
{
  console.log(block)
  
  switch(block.type) {
  case "title":
    return { type: "InfoTitle", param: [block.title[0].text.content] };
    
  case "heading_1":
  case "heading_2":
  case "heading_3":
    return { type: "InfoHeader", param: [block[block.type].text[0].plain_text] };
    
  case "bulleted_list_item":
  case "paragraph":
    let text = "";
    for(let i=0; i<block[block.type].rich_text.length; ++i){
      if(block.type == "bulleted_list_item")
      {
        text += "・";
      }
      
      if(block[block.type].rich_text[i].href)
      {
        text += block[block.type].text[i].plain_text.replace(block[block.type].rich_text[i].href, "<" + block[block.type].rich_text[i].href + ">");
      }
      else
      {
        text += block[block.type].rich_text[i].plain_text
      }
      text += "\n";
    }
    if(text == "") return { type: "InfoSpacer", param: [] };
    return { type: "InfoText", "param": [text] };
  }
  
  return null;
}

//索引用の辞書配列を作る
function constructInfoMaster()
{
	for(let infoKey in infoCache)
	{
		let info = infoCache[infoKey];
		infoList.push({
			id: info.id,
			title: info.title
		});
	}
}

export async function loadInformation()
{
	let result = await getConfig(masterDB);
	for(let page of result)
	{
		//WIPは外す
		console.log(page);
		if(page.Status.name == "WIP") continue;
		
		await setTimeout(50)
		let contents:any = await getContents(page.child_id);
		let pb:any = [];
		//pb.push({ type: "title", "text": page.Name });
		for(let d of contents)
		{
			pb.push(convertToInformationBlock(d));
		}
		infoCache[page.child_id] = 
		{
			id: page.child_id,
			title: page.Name,
			contents: pb
		}
	}
	
	fs.writeFileSync("json/Information.json", JSON.stringify(infoCache, null, 2));
	constructInfoMaster();
    console.log("load information");
}

export async function loadInformationFromCache()
{
	const text = fs.readFileSync("json/Information.json");
    var json = JSON.parse(text);
    infoCache = json;
	constructInfoMaster();
    console.log("load information");
}

export function getList()
{
	return infoList;
}

export function getInformation(id: string)
{
	return infoCache[id];
}

