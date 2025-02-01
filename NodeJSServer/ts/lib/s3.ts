const AWS = require('aws-sdk');
const s3 = new AWS.S3({'region':'ap-northeast-1'});

const backet = "vtn-staticweb";

export async function uploadToS3(logHash: string, text: string) {
	try {
		const putData = await s3.putObject(
		{
			Bucket:backet,
			Key: `vc/log/${logHash}.json`,
			Body: text
		}).promise();
	}catch(ex){
		console.log(ex);
	}
}
