exports.Routes = {
	GET: {
		"/"				: "index#index",
		"/favicon.ico"	: "resource#favicon",
		"/stat" : {
			"/" : "stat#check"
		},
		"/vc" : {
			"/stat" : "vc#stat",
			"/getaddr" : "vc#getaddr",
		},
		"tools" : {
			"/masterupdate" : "tools#masterupdate"
		}
	},
	POST: {
		"/login" : "user#login",
	}
}

exports.Auth = {
	UseSessionAuth: false,
	PassThroughRoute: {
		GET: ["stat","gacha","info","ranking","cm"],
		POST: ["ranking","cm"]
	}
};
