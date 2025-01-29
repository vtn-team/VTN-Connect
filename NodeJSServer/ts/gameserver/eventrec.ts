import { query } from "./../lib/database"
const fs = require('fs').promises;

export interface EventPacker {
	Time: number;
	GameId: number;
	Message: any;
};

//イベント記録クラス
export class EventRecorder {
	events: Array<EventPacker>;
	gameId: number;
	gameHash: string;
	timer: Date;

	constructor(gameId:number, gameHash: string) {
		this.events = [];
		this.gameId = gameId;
		this.gameHash = gameHash;
		this.timer = new Date();
	}

	getElapsedTime() {
		return new Date().valueOf() - this.timer.valueOf();
	}

	//ユーザから受信したメッセージ
	public recordMessage(gameId:number, data: any) {
		this.events.push({
			Time: this.getElapsedTime(),
			GameId: gameId,
			Message: data
		});
	}
	
	public async save(gameHash: string) {
		//リプレイ記録
		let playTime = this.getElapsedTime();
		await query("INSERT INTO GameReplay (GameId, GameHash, PlayTime) VALUES (?, ?, ?)", [this.gameId, this.gameHash, playTime]);
		await fs.writeFile(`replay/${gameHash}.json`, JSON.stringify(this.events));
	}
}


enum PlaybackState {
	NOT_LOAD = 0,
	PLAYBACK,
	END_REEL,
	ERROR,
};

class EventReel {
	gameHash: string;
	events: Array<EventPacker>;
	eventIndex: number;
	callback: any;
	status: PlaybackState;
	timer: Date;

	constructor(gameHash: string, callback: any) {
		this.gameHash = gameHash;
		this.events = [];
		this.eventIndex = 0;
		this.status = PlaybackState.NOT_LOAD;
		this.callback = callback;
		this.timer = new Date();
	}

	getNextTime(time: number) {
		return time - (new Date().valueOf() - this.timer.valueOf());
	}

	public async action() {
		let playbackState = {
			Status: PlaybackState.ERROR,
			NextTimer: -1
		};
		switch (this.status) {
			case PlaybackState.NOT_LOAD:
				try {
					this.timer = new Date();
					let json = await fs.readFile(`replay/${this.gameHash}.json`);
					this.events = JSON.parse(json);
					if (this.events.length == 0) {
						this.status = PlaybackState.END_REEL;
						playbackState.NextTimer = 0;
						break;
					}

					playbackState.NextTimer = this.getNextTime(this.events[0].Time);
					this.status = PlaybackState.PLAYBACK;
				} catch (ex) {
					console.log(ex);
					return playbackState;
				}
				break;

			case PlaybackState.PLAYBACK:
				this.callback(this.events[this.eventIndex].GameId, this.events[this.eventIndex].Message);
				this.eventIndex++;
				if (this.eventIndex >= this.events.length) {
					this.status = PlaybackState.END_REEL;
					playbackState.NextTimer = 0;
					break;
				}
				playbackState.NextTimer = this.getNextTime(this.events[this.eventIndex].Time);
				break;
		}
		playbackState.Status = this.status;
		return playbackState;
	}
};

//イベント再生機
export class EventPlayer {
	gameId: number;
	reels: Array<EventReel>;
	reelIndex: number;
	playbackTimer: any;
	msgExec: any;

	constructor(gameId: number) {
		this.gameId = gameId;
		this.reels = [];
		this.reelIndex = 0;
		this.playbackTimer = null;
		this.msgExec = null;
	}

	async loadReplay() {
		let result = await query("SELECT GameId, GameHash, PlayTime FROM GameReplay WHERE GameId = ?", [this.gameId]);
		if(result.length == 0) {
			//console.log("リプレイデータがない:" + this.gameId);

			this.playbackTimer = setTimeout(async () => {
				await this.loadReplay();
			}, 6000);
			return;
		}

		this.reels = [];
		for(let rp of result) {
			let gameHash = rp.GameHash;
			this.reels.push(new EventReel(gameHash, this.msgExec));
		}

		//console.log("リプレイ開始:" + this.gameId);
		this.reelIndex = 0;
		this.playbackTimer = setTimeout(() => { this.playbackAction() }, 1000);
	}

	async playbackAction() {
		clearTimeout(this.playbackTimer);
		let playbackState = await this.reels[this.reelIndex].action();
		if (playbackState.NextTimer < 0) {
			console.log("再生エラー:" + this.gameId);
			return;
		}

		switch (playbackState.Status) {
			case PlaybackState.PLAYBACK:
				this.playbackTimer = setTimeout(() => { this.playbackAction() }, playbackState.NextTimer);
				break;

			case PlaybackState.END_REEL:
				//console.log("再生終了:" + this.gameId);
				this.reelIndex++;
				if (this.reelIndex >= this.reels.length) {
					//console.log("終了:" + this.gameId);
					this.playbackTimer = setTimeout(async () => {
						await this.loadReplay();
					}, 5000);
					break;
				}

				//console.log("続き:" + this.gameId);
				this.playbackTimer = setTimeout(() => { this.playbackAction() }, 5000);
				break;
		}
	}

	public start(msgExec: any) {
		this.msgExec = msgExec;
		this.playbackTimer = setTimeout(async () => {
			await this.loadReplay();
		},1000);
	}

	public stop() {
		clearTimeout(this.playbackTimer);
	}
}
