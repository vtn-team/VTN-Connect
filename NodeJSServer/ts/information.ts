import { getConfig, getContents } from "./lib/notion"
const { setTimeout } = require('timers/promises');
const fs = require('fs');


function convertToInformationBlock(block: any)
{
  console.log(block)
  
  switch(block.type) {
  case "title":
    return { type: "header1", "text": block.title[0].text.content };
    
  case "heading_1":
  case "heading_2":
  case "heading_3":
    return { type: block.type, "text": block[block.type].text[0].plain_text };
    
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
    if(text == "") return { type: "space" };
    return { type: "section", "text": text };
  }
  
  return null;
}

(async function() {
	let result = await getConfig("f8700577c36c43b989da2fa77174e040");
	let infos:any = [];
	for(let page of result)
	{
		//WIPは外す
		console.log(page);
		if(page.Status.name == "WIP") continue;
		
		await setTimeout(50)
		let contents:any = await getContents(page.child_id);
		let pb:any = [];
    	pb.push({ type: "title", "text": page.Name });
		for(let d of contents)
		{
			pb.push(convertToInformationBlock(d));
		}
		infos.push(pb);
	}
	
	fs.writeFileSync("json/Information.json", JSON.stringify(infos, null, 2));
})();