/**
 * Implements Utility Functions
 */

var winston = require('winston');
require('date-utils');
const fs = require('fs');
var crypto = require('crypto');
var validator = require('validator');
var secureRandom = require('secure-random');

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

var getSEID = function(id){
	return "GENTSE-" + id ;
};

var getRandomBase64 = function(length){
    var r = secureRandom(length, {type: 'Buffer'});
    return Buffer.from(r).toString('base64');
}

// I got this from https://stackoverflow.com/questions/25006460/cant-verify-signature-witn-node-js-crypto-using-key-pairs
const privateKey = '-----BEGIN PRIVATE KEY-----\n\
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg7FRsKBgWYvZWq2uH\n\
qgQQLqZwcitCIIjhrxKCctYTFPihRANCAATGyY6HQXytuVdc8EQNCYeDE6/QaDVK\n\
EaNfdBuGtFe47Nevh/u40ZNBcuP4t9/RNBLTVssjS9E8Lc7TA5Rc7ZHp\n\
-----END PRIVATE KEY-----\n'

const publicKey = '-----BEGIN CERTIFICATE-----\n\
MIIDMDCCAZigAwIBAgIRAJKu7E2Hae0lmIVuz7yImCYwDQYJKoZIhvcNAQELBQAw\n\
PTEVMBMGA1UEAxMMLy8vLy8vLy8vLzg9MQswCQYDVQQGEwJLUjEXMBUGA1UEChMO\n\
R3J1dXQgTmV0d29ya3MwHhcNMTkwMTA4MDE0MjQzWhcNMjkwMTA1MDE0MjQzWjA9\n\
MRUwEwYDVQQDEwxSMFZPVkZORkxURT0xCzAJBgNVBAYTAktSMRcwFQYDVQQKEw5H\n\
cnV1dCBOZXR3b3JrczBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABMbJjodBfK25\n\
V1zwRA0Jh4MTr9BoNUoRo190G4a0V7js16+H+7jRk0Fy4/i339E0EtNWyyNL0Twt\n\
ztMDlFztkemjdjB0MCEGA1UdDgQaBBhwl7gzHfv0off547Q3EupPPqbVfhr3Eaow\n\
HAYDVR0RBBUwE4ERY29udGFjdEBncnV1dC5uZXQwDAYDVR0TAQH/BAIwADAjBgNV\n\
HSMEHDAagBgYJqo0iW9v/30tECWTkkYcGNgp5t6Ms/0wDQYJKoZIhvcNAQELBQAD\n\
ggGBABfVYQVjjYG1CsAoTJ64q/g9kxGmiUU1XqxN+EkrNrZu/ZJtR/1ny5p93Mca\n\
Fc0jAbvJ+VDBVw1OrKx8uAH51GLNXMQ+xTUiv/QnLcbJzszQkoBv23fyTVhba0M0\n\
M1WcbZ68GdtvApRHNy2PU3Sb7/h/uv/6J+kaODRp67CpnlATWBc1cVSPHVKJwHi5\n\
3k/hWc9bMaOynF4HsEOO5LEvgzsMvtbRwtJRTuw/1pp7gCbOZ7MNtYefV8Z6/1wp\n\
uwsKA9rRTsbkI5Yg9hBL2Gu5aoJLwFNdck3HNSqhQEf5Il8uw+j//CthzjthN0vC\n\
ahpXC8RuDEjyt3fWFXiL5gu2VWWaXhSYRSz2xBhxffAOfbB6wGgCnuK7WLLGhqSP\n\
uT6qwcTfsWpzDCjVl8Suvs342q0rmhEdX2eNI0UHkGdF+kCvRlmMo/JG36AsWyYh\n\
Wjq9bO9yGFDddAR/T6fHMrw6PCKxMQ1aCtiyt0jSf5aSnI8Y50PsbRlDCpHd11mb\n\
69V67g==\n\
-----END CERTIFICATE-----\n';

// check out this https://nodejs.org/api/crypto.html#crypto_class_sign
const doSign = function(data){
	var signer = crypto.createSign('sha256');
	signer.update(data);
	return signer.sign(privateKey,'base64');
};

const getTimestamp = function(){
	return (Math.floor(Date.now() / 1000)).toString();
};

const argvParser = function(process_argv){
    var obj = {};
	const len = process_argv.length;
    switch (len){
		case 5:
		obj.n = process_argv[4];

		case 4:
		obj.n = (obj.n)? obj.n : 1;
        obj.addr = process_argv[2];
		obj.port = process_argv[3];
		obj.ok = true;
		checkArgs(obj);
        break;

        default:
        obj.ok = false;
        break;
	}
	return obj;
};

const checkArgs = function(obj){
	try{
		if( !validator.isNumeric(obj.n.toString())){
			obj.n = null;
			obj.ok = false;
		}
		if( !(validator.isIP(obj.addr) || validator.isURL(obj.addr) || obj.addr.toLowerCase() == "localhost") ){
			obj.addr = null;
			obj.ok = false;
		}
		if( !validator.isPort(obj.port)){
			obj.port = null;
			obj.ok = false;
		}
	}
	catch (err){
		console.log(err);
		obj.ok = false;
	}
};

const printHowToUse = function(){
	console.log ("Error: Invalid arguments. Please follow the instructions below.");
	console.log ("node [script_name] [ip_or_addr] [port] [emulator_id]");
	console.log ("- [script_name] should be one of these [merger, signer, tx_generator]");
	console.log ("- [ip_or_addr] should be a valid form of IP or URL ");
	console.log ("- [port] should be a number less than 65535");
	console.log ("- [se_id] should be a number (default: 1)");
};

var self = module.exports = {
	getLogger : getLogger,
	getHMAC : getHMAC,
	getSHA256 : getSHA256,
	get64Hash : get64Hash,
	get32Hash : get32Hash,
	getRandomBetween : getRandomBetween,
	doSign : doSign,
	getTimestamp : getTimestamp,
	argvParser : argvParser,
	printHowToUse: printHowToUse,
	getSEID : getSEID,
	getRandomBase64 : getRandomBase64
};
