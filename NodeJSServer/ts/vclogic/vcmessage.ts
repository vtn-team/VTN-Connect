import { chat } from "./../lib/chatgpt"
import { getAIRule } from "./../lib/masterDataCache"
import { query } from "./../lib/database"

export interface MessagePacket {
	ToUserId: number;
	FromUserId: number;
	AvatarType: number,
	Name: string;
	Message: string;
}

async function checkMessageByChatGPT(message: MessagePacket) {
	let prompt = getAIRule("CheckMessage").RuleText;
	prompt += `
# 入力
送信者：${message.Name}
メッセージ：${message.Message}

# 出力例(JSON)
{
	"Judge" : [検閲されたかどうか],
	"Name": [送信者],
	"Message": [検閲後のメッセージ],
	"Emotion": [-100～100],
}`;

	let chatres:any = await chat(prompt);
	return chatres;
}

//メッセージを検閲し、感情値を分析、格納する
export async function checkMessageAndWrite(message: MessagePacket) {
	let result: any = {
		Success: false
	};
	
	try {
		let data:any = await checkMessageByChatGPT(message);
		let json = JSON.parse(data.content);
		
		//DBに保存
		let ins = await query("INSERT INTO Message (ToUserId, FromUserId, AvatarType, Message, Emotion) VALUES (?, ?, ?, ?, ?)", [message.ToUserId, message.FromUserId, message.AvatarType, json.Message, json.Emotion]);
		
		result.ToUserId = message.ToUserId;
		result.FromUserId = message.FromUserId;
		result.Name = message.Name;
		result.Message = json.Message;
		result.Emotion = json.Emotion;
		
		result.Success = true;
	} catch(ex) {
		console.log(ex);
	}
	
	return result;
}

