import { OpenAI } from "openai";
const { v4: uuidv4 } = require('uuid')
import { CHATGPT_API_TOKEN } from "./../config/config"

const openai = new OpenAI({ apiKey: CHATGPT_API_TOKEN });

const dataModel = "gpt-4o-mini";
const realtimeDataModel = "gpt-4o-realtime-preview-2024-12-17";

let chatSession:any = {};

//モデルのリスト
export async function modelList() {
	var compare = function(a:any, b:any) {
	  return b.created - a.created;
	}
	var list:any = await openai.models.list();
	list.body.data.sort(compare);
	return list.body.data;
}

//セッション取得
export async function getEphemeralKey(instructions: string) {
	var result:any = await openai.beta.realtime.sessions.create({
	    "model": realtimeDataModel,
	    "modalities": ["audio", "text"],
	    "instructions": instructions,
	});
	
	console.log(result);
	return result;
}


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

//コンテキストあり(自由指定)
export async function chatWithContexts(message:Array<any>) {
	const completion = await openai.chat.completions.create({
		messages: message,
		model : dataModel,
		response_format : {"type": "json_object"}
	});

	//console.log(completion);
	if(completion && completion.choices[0]){
		return completion.choices[0].message;
	}
	return "";
}


//コンテキストあり(自由指定)
export async function chatWithContextsText(message:Array<any>) {
	const completion = await openai.chat.completions.create({
		messages: message,
		model : dataModel,
		response_format : {"type": "text" }
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