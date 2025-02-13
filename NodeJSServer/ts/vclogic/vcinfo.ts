import { query } from "./../lib/database"
const { v4: uuidv4 } = require('uuid')

//集積した情報
let currentInfo:any = {};
let isUnderMaintenance = false;

//メンテナンス情報の更新
export function updateMaintenance(isMaintenance: boolean) {
	isUnderMaintenance = isMaintenance;
}

//メンテナンス情報の更新
export function getMaintenance() {
	return isUnderMaintenance;
}
