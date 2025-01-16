exports.Routes = {
	GET: {
		"/"				: "index#index#トップページ",
		"/route"		: "index#route#APIリスト羅列",
		"/favicon.ico"	: "resource#favicon#favicon",
		"/stat" : {
			"/" : "stat#check#状態確認"
		},
		"/vc" : {
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
			}
		},
		"/tools" : {
			"/masterupdate" : "tools#masterupdate#   マスタデータ更新"
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
