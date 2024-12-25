const execSync = require('child_process').execSync;

let elasticIP:string = "localhost";

export function findElasticIP() {
	try {
		const result =  execSync("aws ec2 describe-addresses --query '*[].PublicIp' --output text | tr '\t' '\n'");
		elasticIP = result.trim();
		return result;
	}catch(ex){
		//console.log(ex);
	}
	return "localhost";
}

export function getElasticIP() {
	return elasticIP;
}