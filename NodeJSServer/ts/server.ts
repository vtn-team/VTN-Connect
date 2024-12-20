const http = require('http');
const qs = require('querystring');
const Routes = require('./apiRoute').Routes;
const Auth = require('./apiRoute').Auth;
import { getCache, updateToken } from "./lib/userCache"

function check(method: string, url: string)
{
	let get_vars = "";
	//スラッシュごとにパーティションで区切る。あとは各階層でトラバースする。
	//REST的な考え方に習う
	if( url.indexOf("?") > 0 )
	{
		get_vars = url.substr( url.indexOf("?")+1 );
		url = url.substr( 0, url.indexOf("?") );
	}
	
	console.log(url);
	console.log(get_vars);
	var uris: any = url.split('/');
	var uri_key: any = 2;
	var route: any = Routes[method]["/" + uris[1]];
	var variables: any = {};
	
	if(get_vars != "") {
		var get_queries = get_vars.split('&');
		for(var i=0; i<get_queries.length; ++i) {
			var qs = get_queries[i].split('=');
			variables[qs[0]] = decodeURIComponent(qs[1]);
		}
	}
	
	while( uri_key < uris.length && route != null )
	{
		var key = "/" + uris[uri_key];
		//ひととおりキーを走査する
		var not_found = true;
		var vars :any = {}
		var default_vars :any = null;
		for( var k in route )
		{
			if( key == k && !(uri_key+1 < uris.length && key == "/"))
			{
				//console.log("here2" + key);
				not_found = false;
			}
			
			//@から始まる場合は変数
			if( k.indexOf("@") == 0 )
			{
				// /のときはワイルドみたいなもんなので、変数を優先する
				if( key == "/" ) {
					not_found = true;
				}
				default_vars = default_vars || k;
				var var_key = "";
				var type = "string";
				var p=k.indexOf("%");
				if( p < 0 )
				{
					var_key	= k.substring(1);
				}else{
					var_key	= k.substring(1, p);
					type = k.substring(p+1);
					switch( type )
					{
						case "n":
						case "d":
						case "f":
							type = "number";
							break;
						case "s":
							type = "string";
							break;
					}
				}
				
				vars[k] = { "key": var_key, "type" : type };
			}
		}
		
		//console.log(vars);
		
		//変数をあてがう
		if( not_found && default_vars != null)
		{
			//typeに一致しているやつをみつける
			var value = uris[uri_key];
			if( value.match(/^-?[0-9]+$/) ){
				value = Number(value);
			}else if( value.match(/^-?[0-9]+\.[0-9]+$/) ){
				value = parseFloat( value );
			}
			var find = false;
			for( var k in vars )
			{
				if( typeof value == vars[k]["type"] )
				{
					//route選択
					route = route[k];
					
					//変数を入れる
					variables[vars[k]["key"]] = value;
					
					find = true;
				}
			}
			
			//type不一致のときは最初にヒットしたやつ(default_vars)とする
			if( !find )
			{
				route = route[default_vars];
				
				//変数を入れる
				variables[vars[default_vars]["key"]] = value;
			}
		}else{
			var next = route[key];
			if( next == null )
			{
				break;
			}else{
				route = next;
			}
		}
		uri_key++;
	}

	//routeがobjectの場合、"/"かNot Foundを返す
	if( typeof route == "object" )
	{
		if( "/" in route )
		{
			route = route["/"];
		}else{
			//Not found
			route = null;
		}
	}
	
	var actions = ["",""];
	if( route ) {
		actions = route.split('#')
	}
	
	var isAuth = Auth.UseSessionAuth;
	if(Auth.PassThroughRoute[method])
	{
		if(Auth.PassThroughRoute[method].indexOf(actions[0]) != -1)
		{
			isAuth = false;
		}
	}
	
	var result = {
		route: route,
		auth: isAuth,
		action: actions[0],
		target: actions[1],
		query : variables
	};
	
	return result;
}

async function run(req: any, res: any, route: any) {
	console.log(route);
	let apiScript = require('./server/' + route.action);
	let target = route.target;
	if(!target) target = "run";
	if(apiScript)
	{
		let vChk = true;
		if(apiScript.varCheck) vChk = apiScript.varCheck(route);
		if(!vChk || !apiScript[target]) {
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write("invalid parameter.");
			res.end();
			return ;
		}
		
		//session check
		if(route.auth)
		{
			route.session = await getCache(route.query.session);
			console.log(route.session);
			if(target != "login" && !route.session) {
				res.writeHead(503, {'Content-Type': 'text/html'});
				res.write("invalid session.");
				res.end();
				return ;
			}
			if(target != "login" && req.method == "POST") {
				console.log(target);
				//POSTの場合重複送信を避けるためtokenを確認
				if(target != "login" && route.query.token != route.session.token) {
					res.writeHead(503, {'Content-Type': 'text/html'});
					res.write("already send.");
					res.end();
					return ;
				}
			}
		}
		
		let result = await apiScript[target](req,res,route);
		//POSTの場合重複送信を避けるためtokenを更新
		if(target != "login" && req.method == "POST" && route.auth) {
			result.token = await updateToken(route.query.session);
		}
		console.log(result);
		if(!result) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write("run..." + route.action);
			res.end();
		}else{
			if(typeof result == "object")
			{
				if(result.statusCode)
				{
					res.writeHead(result.statusCode, {'Content-Type': 'application/json'});
				}else{
					res.writeHead(200, {'Content-Type': 'application/json'});
				}
				res.write(JSON.stringify(result, null ,2));
			}
			else
			{
				if(result.statusCode)
				{
					res.writeHead(result.statusCode, {'Content-Type': 'text/plain'});
				}else{
					res.writeHead(200, {'Content-Type': 'text/plain'});
				}
				res.write(result);
			}
			res.end();
		}
	}
	else
	{
		res.writeHead(404, {'Content-Type': 'text/html'});
		res.write("not found..." + route.action);
		res.end();
	}
}

// サーバを起動する
export function launch() {
	var app = http.createServer(async function (req: any, res: any) {
		if(!req) return res.end();
		if(!req.method) return res.end();
		if(!req.url) return res.end();
		
		let route = check(req.method, req.url);
		if(route.action == "resource") return res.end();
		
		if(req.method == "POST") {
			//console.log(req);
			req.setEncoding('utf8');
			let data = "";
			req.on('data', (chunk: any) => {
				data += chunk;
				console.log('BODY: ' + chunk);
			});
			req.on('end', async () => {
				//end of data
				var isParsed = false;
				try {
					console.log(data);
					let d = JSON.parse(data);
					for(var k in d) {
						route.query[k] = d[k];
					}
					isParsed = true;
				}catch(ex){
					console.log(ex);
				}
				
				if(!isParsed){
					try {
						var d = qs.parse(decodeURIComponent(data));
						for(var k in d) {
							route.query[k] = d[k];
						}
						isParsed = true;
					}catch(ex){
						console.log(ex);
					}
				}
				
				console.log('END:');
				await run(req,res,route);
			})
			return ;
		}
		await run(req,res,route);
	}).listen('4649', '127.0.0.1');

	app.on('uncaughtException', function(err: any) {
		console.log("Caught exception: " + err);
		console.trace();
	});
}
