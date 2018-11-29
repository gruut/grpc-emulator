/**
 * Implements Utility Functions
 */

var winston = require('winston');
require('date-utils');
const fs = require('fs');
var crypto = require('crypto');

// https://stackoverflow.com/questions/32131287/how-do-i-change-my-node-winston-json-output-to-be-single-line
var getLogger = function(type_name){
	const logDir = 'logs';
	if (!fs.existsSync(logDir)) {
		fs.mkdirSync(logDir);
	}

	const { splat, combine, timestamp, printf } = winston.format;

	// meta param is ensured by splat()
	const myFormat = printf(({ timestamp, level, message, meta }) => {
	return `${timestamp};${level};${message};${meta? JSON.stringify(meta) : ''}`;
	});

	var options = {
		file: {
			level: 'info',
			name: 'server.info',
			filename: 'logs/' + type_name + '.log',
			handleExceptions: true,
			maxsize: 5242880, // 5MB
			maxFiles: 100,
		},
		errorFile: {
			level: 'error',
			name: 'server.error',
			filename: 'logs/' + type_name + 'error.log',
			handleExceptions: true,
			maxsize: 5242880, // 5MB
			maxFiles: 100,
		},
		console: {
			level: 'debug',
			handleExceptions: true,
		}
	};

	return winston.createLogger({
		format: combine(
			timestamp(),
			splat(),
			myFormat
		),
		transports: [
			new (winston.transports.File)(options.errorFile),
			new (winston.transports.File)(options.file),
			new (winston.transports.Console)(options.console)
		],
		exitOnError: false, // do not exit on handled exceptions
	});
};

var getHMAC = function(data){
	const secret = '0x0000000000000000000000000000000000000000000000000000000000000000';
	const hash = crypto.createHmac('sha256', Buffer.from(secret, 'hex'))
	                   .update(data)
	                   .digest('hex');
	return hash;
}

var getSHA256 = function(data){
	return crypto.createHash('sha256').update(data).digest('base64');
};

var get64Hash = function(data){
	return crypto.createHash('sha256').update(data).digest('hex').substr(0, 16);
};

var get32Hash = function(data){
	return crypto.createHash('sha256').update(data).digest('hex').substr(0, 8);
};

var getRandomBetween = function(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

// I got this from https://stackoverflow.com/questions/25006460/cant-verify-signature-witn-node-js-crypto-using-key-pairs
const privateKey = '-----BEGIN RSA PRIVATE KEY-----\n'+
'MIICXQIBAAKBgQDCtTEic76GBqUetJ1XXrrWZcxd8vJr2raWRqBjbGpSzLqa3YLv\n'+
'VxVeK49iSlI+5uLX/2WFJdhKAWoqO+03oH4TDSupolzZrwMFSylxGwR5jPmoNHDM\n'+
'S3nnzUkBtdr3NCfq1C34fQV0iUGdlPtJaiiTBQPMt4KUcQ1TaazB8TzhqwIDAQAB\n'+
'AoGAM8WeBP0lwdluelWoKJ0lrPBwgOKilw8W0aqB5y3ir5WEYL1ZnW5YXivS+l2s\n'+
'tNELrEdapSbE9hieNBCvKMViABQXj4DRw5Dgpfz6Hc8XIzoEl68DtxL313EyouZD\n'+
'jOiOGWW5UTBatLh05Fa5rh0FbZn8GsHrA6nhz4Fg2zGzpyECQQDi8rN6qhjEk5If\n'+
'+fOBT+kjHZ/SLrH6OIeAJ+RYstjOfS0bWiM9Wvrhtr7DZkIUA5JNsmeANUGlCrQ2\n'+
'cBJU2cJJAkEA26HyehCmnCkCjit7s8g3MdT0ys5WvrAFO6z3+kCbCAsGS+34EgnF\n'+
'yz8dDdfUYP410R5+9Cs/RkYesqindsvEUwJBALCmQVXFeKnqQ99n60ZIMSwILxKn\n'+
'Dhm6Tp5Obssryt5PSQD1VGC5pHZ0jGAEBIMXlJWtvCprScFxZ3zIFzy8kyECQQDB\n'+
'lUhHVo3DblIWRTVPDNW5Ul5AswW6JSM3qgkXxgHfYPg3zJOuMnbn4cUWAnnq06VT\n'+
'oHF9fPDUW9GK3yRbjNaJAkAB2Al6yY0KUhYLtWoEpQ40HlATbhNel2cn5WNs6Y5F\n'+
'2hedvWdhS/zLzbtbSlOegp00d2/7IBghAfjAc3DE9DZw\n'+
'-----END RSA PRIVATE KEY-----';

const publicKey = '-----BEGIN PUBLIC KEY-----\n'+
'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCtTEic76GBqUetJ1XXrrWZcxd\n'+
'8vJr2raWRqBjbGpSzLqa3YLvVxVeK49iSlI+5uLX/2WFJdhKAWoqO+03oH4TDSup\n'+
'olzZrwMFSylxGwR5jPmoNHDMS3nnzUkBtdr3NCfq1C34fQV0iUGdlPtJaiiTBQPM\n'+
't4KUcQ1TaazB8TzhqwIDAQAB\n'+
'-----END PUBLIC KEY-----';

const signRSA = function(data){
	var signer = crypto.createSign('sha256');
	signer.update(data);
	return signer.sign(privateKey,'base64');
};

const getTimestamp = function(){
	return (Math.floor(Date.now() / 1000)).toString();
}


var self = module.exports = {
	getLogger : getLogger,
	getHMAC : getHMAC,
	getSHA256 : getSHA256,
	get64Hash : get64Hash,
	get32Hash : get32Hash,
	getRandomBetween : getRandomBetween,
	signRSA : signRSA,
	getTimestamp : getTimestamp
};

