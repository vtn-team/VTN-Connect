import { OpenAI } from "openai";
const { v4: uuidv4 } = require('uuid')
import { CHATGPT_API_TOKEN } from "./../config/config"

const openai = new OpenAI({ apiKey: CHATGPT_API_TOKEN });

const dataModel = "gpt-4o-mini";

let chatSession:any = {};


//コンテキスト無し
export async function chat(prompt:any) {
	const completion = await openai.chat.completions.create({
		messages: [{ role: "user", content: prompt }],
		model : dataModel,
		response_format : {"type": "json_object"}
	});

	//console.log(completion);
	if(completion && completion.choices[0]){
		return completion.choices[0].message;
	}
	return "";
}

//コンテキストあり(覚えているメッセージを使って聞く)
export async function chatWithSession(sessionId:string|null, prompt:any) {
	let session:string = "";
	if(!sessionId) {
		session = uuidv4();
	}else{
		session = sessionId;
	}
	
	
	if(!chatSession[session]) {
		chatSession[session] = {
			contexts: []
		};
	}
	
	let contexts = [];
	for(let c of chatSession[session].contexts) {
		contexts.push(c);
	}
	contexts.push({ role: "user", content: prompt });
	chatSession[session].contexts.push({ role: "user", content: prompt });
	
	console.log(contexts);
	const completion = await openai.chat.completions.create({
		messages: contexts,
		model : dataModel,
		response_format : {"type": "json_object"}
	});
	
	//console.log(completion);
	if(completion && completion.choices[0]){
		chatSession[session].contexts.push(completion.choices[0].message);
		return {
			sessionId: session,
			content: completion.choices[0].message.content
		};
	}
	
	return "";
}

//コンテキストの削除
export async function deleteSession(sessionId:string) {
	if(chatSession[sessionId]) {
		delete chatSession[sessionId];
	}
}