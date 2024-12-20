exports.Scheme = {
	User: { "Version": 2, Scheme: ["id", "udid", "name"] },
	UserCards: { "Version": 2, Scheme: ["id", "userId", "cardId", "level","luck"] },
	UserItems: { "Version": 1, Scheme: ["id", "userId", "itemId", "amount"] },
	UserQuests: { "Version": 1, Scheme: ["id", "userId", "questId", "score","clearFlag"] },
}
