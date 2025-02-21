import { getMaster, getGameInfo, getGameEvent, getQRSheet, getQREvent } from "./../lib/masterDataCache"
import { getUserFromId, getUserFromHash, getRewardsByEventCode } from "./../vclogic/vcuser"
import { UserSession, VCUserSession, CMD, TARGET, createdPayload } from "./session"

import { ArtifaceEventStack, execArtifactAppearEvent } from "./../vclogic/vcgame"


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
	
	public async execEvent(data: any) {
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
		let qrMaster = getQRSheet(serialCode);
		
		if(!qrMaster) {
			msgData.Message = "存在しないシリアルコードです";
			return {
				Status: 0,
				Message: msgData,
			};
		}
		
		if(this.serialDic[data.UserId] && qrMaster.Type == 2 && !data.IsDebug) {
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
		if( qrMaster.Type == 1 ) {
			retData.Command = CMD.SEND_EVENT;
			retData.EventId = 1000;
			retData.Payload = createdPayload({
				GameId : qrMaster.TargetId,
				UserId : data.UserId
			});
			
			msgData = {
				Command:CMD.USERSTAT,
				UpdateStat: {
					GameId: qrMaster.TargetId,
					UserId : data.UserId
				},
				GameId: 99,
				UserId: data.UserId
			};
		}
		
		//NOTE: リリンク
		
		if( qrMaster.Type == 2 ) {
			//効果
			let qrEvents = getQREvent(qrMaster.TargetId);
			
			//重みづけ確率
			let total = 0;
			for(var qr of qrEvents)
			{
				if(qr.Probability == "") continue;
				total += qr.Probability;
			}
	
			let get:any = null;
			let random:number = Math.floor(Math.random() * total);
			for(var qr of qrEvents)
			{
				if(qr.Probability == "") continue;
				random -= qr.Probability;
				if(random < 0)
				{
					get = qr;
					break;
				}
			}
			
			console.log(get);
			
			if(get.Flag == "Coin" || get.Flag == "Both") {
				retData.Command = CMD.SEND_EVENT;
				retData.EventId = 1002;
				retData.Payload = createdPayload({
					UserId : data.UserId,
					GetGold: get.Value
				});
			}
			
			if(get.Flag == "Event") {
				retData.Command = CMD.SEND_EVENT;
				retData.EventId = get.Value;
				retData.Payload = createdPayload({
					UserId : data.UserId
				});
			}
			
			
			let updateResult = null;
			switch(get.Flag)
			{
			case "Coin":
				updateResult = await getRewardsByEventCode(data.UserId, get.Value, 0);
				break;
				
			case "Exp":
				updateResult = await getRewardsByEventCode(data.UserId, 0, get.Value);
				break;
				
			case "Both":
				updateResult = await getRewardsByEventCode(data.UserId, get.Value, get.Value);
				break;
			}
			
			//QR読み込みでアーティファクトカウントを追加
			execArtifactAppearEvent(ArtifaceEventStack.QRCODE, qrMaster.TargetId);
			
			if(updateResult) {
				msgData = {
					Command:CMD.USERSTAT,
					UpdateStat: updateResult,
					GameId: 99,
					UserId: data.UserId
				};
			}
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
