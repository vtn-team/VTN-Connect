const { GoogleGenerativeAI } = require("@google/generative-ai");
import { GEMINI_API_TOKEN } from "./../config/config"
const { v4: uuidv4 } = require('uuid')

const dataModel = "gemini-1.5-flash";

const gemini = new GoogleGenerativeAI(GEMINI_API_TOKEN);

let chatSession:any = {};

//モデルのリスト
export async function modelList() {
	var compare = function(a:any, b:any) {
	  return b.created - a.created;
	}
	
	var req:any = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_TOKEN}`);
	var list = await req.json();
	return list.models;
}

//メッセージ送信
export async function chat(prompt:any) {
	const client = gemini.getGenerativeModel({ model: dataModel });
	const result = await client.generateContent({
		contents: [{ role: "user",	parts: [{
				text: prompt,
			}],
		}],
		generationConfig: {
			maxOutputTokens: 1000,
			temperature: 0.1,
		}
	});
	
	return result.response.text();
}

//メッセージ送信
export async function chatWithModel(model: string, prompt:any) {
	const client = gemini.getGenerativeModel({ model: model });
	const result = await client.generateContent({
		contents: [{ role: "user",	parts: [{
				text: prompt,
			}],
		}],
		generationConfig: {
			maxOutputTokens: 1000,
			temperature: 0.1,
		}
	});
	
	return result.response.text();
}

//コンテキストあり(自由指定)
export async function chatWithContexts(message:Array<any>) {
	const client = gemini.getGenerativeModel({ model: dataModel });
	const result = await client.generateContent({
		contents: message,
		generationConfig: {
			maxOutputTokens: 1000,
			temperature: 0.1,
		}
	});
	
	return result.response.text();
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
	chatSession[session].contexts.push({ role: "user", parts: [{ text: prompt }] });
	
	console.log(contexts);
	const client = gemini.getGenerativeModel({ model: dataModel });
	const result = await client.generateContent({
		contents: contexts,
		generationConfig: {
			maxOutputTokens: 1000,
			temperature: 0.1,
		}
	});
	
	/*
	//console.log(completion);
	if(completion && completion.choices[0]){
		chatSession[session].contexts.push(completion.choices[0].message);
		return {
			sessionId: session,
			content: completion.choices[0].message.content
		};
	}
	*/
	return "";
}

//コンテキストの削除
export async function deleteSession(sessionId:string) {
	if(chatSession[sessionId]) {
		delete chatSession[sessionId];
	}
}