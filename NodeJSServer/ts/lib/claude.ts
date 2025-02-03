import { CLAUDE_API_TOKEN } from "./../config/config"

import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: CLAUDE_API_TOKEN });

const dataModel = "claude-3-5-sonnet-20241022";


//モデルのリスト
export async function modelList() {
	var compare = function(a:any, b:any) {
	  return new Date(b.created).valueOf() - new Date(a.created).valueOf();
	}
	var list:any = await anthropic.models.list();
	list.body.data.sort(compare);
	return list.body.data;
}

//メッセージ送信
export async function chat(prompt:any) {
	const msg = await anthropic.messages.create({
		model: dataModel,
		max_tokens: 1000,
		messages: [{
			"role": "user",
			"content": [{
				"type": "text",
				"text": prompt
			}]
		}]
	});
	return msg;
}


//メッセージ送信
export async function chatWithModel(model: string, prompt:any) {
	const msg = await anthropic.messages.create({
		model: model,
		max_tokens: 1000,
		messages: [{
			"role": "user",
			"content": [{
				"type": "text",
				"text": prompt
			}]
		}]
	});
	return msg;
}
