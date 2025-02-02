import { chat as chatByChatGPT, chatWithModel as chatWithModelByChatGPT, modelList as modelListByOpenAI, chatWithSession, getEphemeralKey } from "./../lib/chatgpt"
import { chat as chatByClaude, chatWithModel as chatWithModelByClaude, modelList as modelListByAnthropic } from "./../lib/claude"
import { chat as chatByGemini, chatWithModel as chatWithModelByGemini, modelList as modelListByGoogle } from "./../lib/gemini"


// General ///////////////////////////////////////////////////////////////////////////////////

//AIモデル一覧
export async function modelist(req: any,res: any,route: any)
{
	let openAI:any = await modelListByOpenAI();
	let anthropic: any = await modelListByAnthropic();
	let google: any = await modelListByGoogle();
	
	return {
		Status: 200,
		OpenAIModels: openAI,
		AnthropicModels: anthropic,
		GoogleModels: google,
	};
}

//AIを比較する
export async function chatEvaluate(req: any,res: any,route: any)
{
	let openAiResult = await chatByChatGPT(route.query.prompt);
	let anthropicResult = await chatByClaude(route.query.prompt);
	let googleResult = await chatByGemini(route.query.prompt);
	
	return {
		Status: 200,
		OpenAIResult: openAiResult,
		AnthropicResult: anthropicResult,
		GoogleResult: googleResult,
	};
}



// OpenAI (ChatGPT) ///////////////////////////////////////////////////////////////////////////

//ChatGPTと会話する
export async function chatToOpenAI(req: any,res: any,route: any)
{
	let result: any = await chatByChatGPT(route.query.Prompt);
	return {
		Status: 200,
		Result: result.content
	};
}

//ChatGPTと会話する
export async function chatToOpenAIWithModel(req: any,res: any,route: any)
{
	let result: any = await chatWithModelByChatGPT(route.query.Model, route.query.Prompt);
	return {
		Status: 200,
		Result: result.content
	};
}

//AIトークン取得
export async function ephemeralkey(req: any,res: any,route: any)
{
	let result:any = await getEphemeralKey(route.query.Instructions);
	
	result.Status = 200;
	
	return {
		Status: 200,
		SessionId: result.id,
		EphemeralKey: result.client_secret.value,
		KeyExpiresAt: result.client_secret.expires_at,
		Object: result
	};
}


// Anthropic (Claude) ///////////////////////////////////////////////////////////////////////////

//Claudeと会話する
export async function chatToClaude(req: any,res: any,route: any)
{
	let threadHash = route.query.threadHash;
	let result: any = await chatByClaude(route.query.Prompt);
	
	return {
		Status: 200,
		Result: result.content[0].text
	};
}


//Claudeと会話する
export async function chatToClaudeWithModel(req: any,res: any,route: any)
{
	let threadHash = route.query.threadHash;
	let result: any = await chatWithModelByClaude(route.query.Model, route.query.Prompt);
	
	return {
		Status: 200,
		Result: result.content[0].text
	};
}


// Google (Gemini) ///////////////////////////////////////////////////////////////////////////

//Geminiと会話する
export async function chatToGemini(req: any,res: any,route: any)
{
	let threadHash = route.query.threadHash;
	let result: string = await chatByGemini(route.query.Prompt);
	
	return {
		Status: 200,
		Result: result
	};
}

//Geminiと会話する
export async function chatToGeminiWithModel(req: any,res: any,route: any)
{
	let threadHash = route.query.threadHash;
	let result: string = await chatWithModelByGemini(route.query.Model, route.query.Prompt);
	
	return {
		Status: 200,
		Result: result
	};
}