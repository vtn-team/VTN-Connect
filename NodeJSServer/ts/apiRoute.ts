exports.Routes = {
	GET: {
		"/"				: "index#index#トップページ",
		"/route"		: "index#route#APIリスト羅列",
		"/favicon.ico"	: "resource#favicon#favicon",
		"/manifest.json" : "debug#manifest#Webテスト",
		"/serviceworker.js" : "debug#serviceworker#Webテスト",
		"/stat" : {
			"/" : "stat#check#状態確認"
		},
		"/vc" : {
			"/" : "debug#web#                      Webテスト",
			"/stat" : "vc#stat#                    ゲームの状況確認",
			"/getaddr" : "vc#getaddr#              ゲームサーバ接続情報取得",
			"/user" : {
				"@id%d" : "vc#getUser#             ユーザ取得",
				"@hash%s" : "vc#getUser#           ユーザ取得",
			},
			"/gameusers" : "vc#getGameUsers#       ゲーム参加ユーザの取得",
			"/usercreate" : "vc#createUser#        ユーザ生成(テスト用)",
			
			"/gamestart" : "vc#gameStart#           ゲーム開始",
			"/gameend" : "vc#gamEend#               ゲーム終了",
			"/ai" :{
				"/gamestart" : "vc#gameStartAI#     ゲーム開始",
				"/gameend" : "vc#gameEndAI#         ゲーム終了",
			},
			"/epictest" : "vc#epictest#             冒険の書を作る",
		},
		"/tools" : {
			"/masterupdate" : "tools#masterupdate#   マスタデータ更新",
			"/modelist" : "ai#modelist#            モデルリスト"
		},
		"/ai" : {
			"/modelist" : "ai#modelist#            モデルリスト"
		}
	},
	POST: {
		"/login" : "user#login",
		"/vc" : {
			"/usercreate" : "vc#createUser#        ユーザ生成(テスト用)",
			"/gamestart" : "vc#gameStart#          ゲーム開始",
			"/gameend" : "vc#gameEnd#              ゲーム終了",
			"/ai" :{
				"/gamestart" : "vc#gameStartAI#     ゲーム開始",
				"/gameend" : "vc#gameEndAI#         ゲーム終了",
			}
		},
		"/tools" : {
			"/ephemeralkey" : "ai#ephemeralkey#     エフェメラルキーを取得"
		},
		"/ai" : {
			"/all" : {
				"/eval" : "ai#chateval#          チャット比較"
			},
			"/openai" : {
				"/chat" : "ai#chatToOpenAIWithModel#          チャット"
			},
			"/anthropic" : {
				"/chat" : "ai#chatToClaudeWithModel#          チャット"
			},
			"/google" : {
				"/chat" : "ai#chatToGeminiWithModel#          チャット"
			}
		}
	}
}

exports.Auth = {
	UseSessionAuth: false,
	PassThroughRoute: {
		GET: [],
		POST: []
	}
};
