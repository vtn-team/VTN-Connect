exports.Routes = {
	GET: {
		"/"				: "index#index",
		"/route"		: "index#route",
		"/favicon.ico"	: "resource#favicon",
		"/stat" : {
			"/" : "stat#check"
		},
		"/vc" : {
			"/stat" : "vc#stat",
			"/getaddr" : "vc#getaddr",
			"/user" : {
				"@id%d" : "vc#getUser",
				"@hash%s" : "vc#getUser",
			},
			"/usercreate" : "vc#createUser",
		},
		"tools" : {
			"/masterupdate" : "tools#masterupdate"
		}
	},
	POST: {
		"/login" : "user#login",
		"/vc" : {
			"/usercreate" : "vc#createUser",
		},
		
	}
}

exports.Auth = {
	UseSessionAuth: false,
	PassThroughRoute: {
		GET: [],
		POST: []
	}
};
