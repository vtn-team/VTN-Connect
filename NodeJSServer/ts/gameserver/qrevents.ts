import { getMaster, getGameInfo, getGameEvent } from "./../lib/masterDataCache"
import { getUserFromId, getUserFromHash } from "./../vclogic/vcuser"
import { UserSession, VCUserSession, CMD, TARGET, createdPayload } from "./session"

const QRCodes: any = {
	"a4cf1e07-cd1a-40ab-9d6f-755d344cf550" : { Pattern: "Rewards" },
	"810f1f50-6a2b-4a8d-8908-a37b9afe9ec2" : { Pattern: "Link", GameId: 2 },
};


//QRイベント
//NOTE: シリアルコードを処理する
export class QREventer {
	users: any;
	serialDic: any;

	constructor() {
		this.users = {};
		this.serialDic = {};
	}

	execSerialCode(userId: number, data: any) {
		if(data["Command"] != CMD.SEND_QR) return;
		
		data.SerialCode
	}
	
	public execEvent(data: any) {
		/*
		SessionId: wsSessionId,
		Command: CMD.SEND_QR,
		SerialCode: code,
		UserId: userData.UserId
		*/
		
		let msgData:any = {
			Command:CMD.ERROR,
			Message: "",
			GameId: 99,
			UserId: data.UserId
		};
		
		let serialCode = data.SerialCode;
		
		if(!QRCodes[serialCode]) {
			msgData.Message = "存在しないシリアルコードです";
			return {
				Status: 0,
				Message: msgData,
			};
		}
		
		if(this.serialDic[data.UserId]) {
			let note = this.serialDic[data.UserId];
			if(note[serialCode]) {
				let date = note[serialCode];
				let left = (new Date().getTime()) - date;
				if(left < 600000) {
					msgData.Message = "連続で報酬は受け取れません";
					return {
						Status: 0,
						Message: msgData,
					};
				}
			}
		}else{
			this.serialDic[data.UserId] = {}
		}
		
		this.serialDic[data.UserId][serialCode] = (new Date()).getTime();
		
		//TODO: リワード計算
		let retData:any = {};
		msgData = {}
		if( QRCodes[serialCode].Pattern == "Link" ) {
			retData.Command = CMD.SEND_EVENT;
			retData.EventId = 1000;
			retData.Payload = createdPayload({
				GameId : QRCodes[serialCode].GameId,
				UserId : data.UserId
			});
		}
		
		if( QRCodes[serialCode].Pattern == "Rewards" ) {
			retData.Command = CMD.SEND_EVENT;
			retData.EventId = 1002;
			retData.Payload = createdPayload({
				GameId : QRCodes[serialCode].GameId,
				UserId : data.UserId
			});
		}
		
		//
		let ret = {
			Status: 1,
			Data: retData,
			Message: msgData,
		};
		console.log(ret);
		return ret;
	}
};
