/**
 * Implements Utility Functions
 */

var winston = require('winston');
require('date-utils');
const fs = require('fs');
var crypto = require('crypto');
var validator = require('validator');

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
const privateKey = '-----BEGIN PRIVATE KEY-----\n\
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMBQUNCNMLLsb9\
IEhsp+1AQuoxeCl32SsDcIo5HHNWWsUtc+iI2ZK8rESunCecSpRbaJDRO4GLr6vl\
akuJf5woxG94ZnYcWzEpBL8TZ7SI9VIZNkdA4voz9a3t3GVsD52zws4sukl7xG7x\
5leTUXHe703a9kq5wcCjHpR758r43p27i2ndXtsh0fr8tozpVsjfoyLfZVRcvaEM\
gKlRq3bLv3HaHJXaj+QNNAMUG7Wg3wpyDzaZ+EvR3934cPX1zN/49lhKrAyzlHls\
tfjogef8fMm6PfkSgW84p5AxyRVgT/G2OcbBgTnGGTp8bdSZzxBWucVSgrbG6+aT\
C/P32S0VAgMBAAECggEAFAXqGP1kuRQ+M1mXwhI5FrV6hqBkcX6+2feRmUlRiIgg\
EfXuPIAeBqZhl0F8IbqwFMiObfqJHEyBcmKcR0Je8SFWT1q+/Ml2abAtkJn8/fQV\
uqO5GoUsSS0zhMS8r35Y2+uikIE39Q2yVctljO/RXS/fVD4X12NMpLW7nO2C3inO\
FSUAJm5S/YkeaFYDFrN8/9gJZGFKN2+Sv5tiOmBT1ADJy7GBrbDz5h36dHMbOPqJ\
0cKFJOoOhWzgM+xUU71iEyHQgZDJg/9FUaReJ5JXEQEOHV/2jv7RxtdfVs+B96s4\
BjN4XaujGAXHrylWp/q1AlKIB83Uyq4o5i/oYpRoAQKBgQD2R1Y0tib1CfNDNPjY\
evlk5bOEPQMGXzyfOFICDCtEgxkATXn4FWtfa6V41RhTFyVPFO6hlQVmneYFH2Dw\
4QJuZvG6U1PjWHGdCYRmJhP9LGQgBMA/9U/etHeNka3Vx/e6USf1HHVpI121exYk\
IXKqq7JwiG0Vkd+1/TJ3KZx+UQKBgQDUEqb8qI1+dP/+aK33bXdaSpx3S1oU92II\
3c8O193hPF3vJGJnCS1exw3hZK6zkcZbWhbBTPDZH8fzj/d+Es/xjMTKaKVpe+ah\
IJRJr/En0Gjv0jltX9hhKqtOepSH6A7+qWNjbh7jmDC0kdvqXjJ8tjDy8fh4v8GK\
NBDyhH59hQKBgQDuvJR6oKD/JNgmLDGWWQ9tmaX96M8H3EZ96jDFP1qqHZOc0X4M\
2Waup0FO8vOTiHpoQNha1oTXxvT1vkdQ+i5LK4vknWZSmqf4HQO1qe/ympes2i4r\
UfhM4RCLsc6b0C769DURzLacZuYuSNVbzPjFLY/ausVUBYaheoLzNOk5IQKBgBK2\
nqOW3/1zp480f31g3HJMOShRrt5AwhbUM8w0gjC42fUbOc+rwKQnXnMwJjZUO7Od\
7HocJviR1FwKrSUj1dOTv125BDedpkk7jbo+20HPIyNeYpDjLz3LvRgMuwSPFpuk\
KNACTJl6uXmFkWlJ7JySmxkk/u7wxMxEMeakiGDdAoGBAIiD3KO95/iQBWuWLB3S\
sNyKfyJCRSXAM21xKybdfT0Z+pjlsgnYRP/I+cr5erXJtdCiGhT7jCrHZa/aSyjH\
kmdXEnX53SsPUmta3tUJJU1+g2Ro4oU9VNn7ZkKP4+6vm5J9gUDdse/VyNVJgP+5\
kA9L3IRnKYOfj/Q9rXnyYnGa\n\
-----END PRIVATE KEY-----\n';

const publicKey = '-----BEGIN CERTIFICATE-----\n\
MIID+zCCAmOgAwIBAgIRAPUuiEOLwpSCAxKaoHit29QwDQYJKoZIhvcNAQELBQAw\
PTEVMBMGA1UEAxMMLy8vLy8vLy8vLzg9MQswCQYDVQQGEwJLUjEXMBUGA1UEChMO\
R3J1dXQgTmV0d29ya3MwHhcNMTgxMjE1MTQyMTI2WhcNMjgxMjEyMTQyMTI2WjA9\
MRUwEwYDVQQDEwxSMFZPVkZORkxURT0xCzAJBgNVBAYTAktSMRcwFQYDVQQKEw5H\
cnV1dCBOZXR3b3JrczCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMwF\
BQ0I0wsuxv0gSGyn7UBC6jF4KXfZKwNwijkcc1ZaxS1z6IjZkrysRK6cJ5xKlFto\
kNE7gYuvq+VqS4l/nCjEb3hmdhxbMSkEvxNntIj1Uhk2R0Di+jP1re3cZWwPnbPC\
ziy6SXvEbvHmV5NRcd7vTdr2SrnBwKMelHvnyvjenbuLad1e2yHR+vy2jOlWyN+j\
It9lVFy9oQyAqVGrdsu/cdocldqP5A00AxQbtaDfCnIPNpn4S9Hf3fhw9fXM3/j2\
WEqsDLOUeWy1+OiB5/x8ybo9+RKBbzinkDHJFWBP8bY5xsGBOcYZOnxt1JnPEFa5\
xVKCtsbr5pML8/fZLRUCAwEAAaN2MHQwIQYDVR0OBBoEGCSk/2nBZ8A8ofTV7IEo\
PzpubsEit8eorzAcBgNVHREEFTATgRFjb250YWN0QGdydXV0Lm5ldDAMBgNVHRMB\
Af8EAjAAMCMGA1UdIwQcMBqAGBgmqjSJb2//fS0QJZOSRhwY2Cnm3oyz/TANBgkq\
hkiG9w0BAQsFAAOCAYEAcmEJAXu0fT/kVhrvql50j9ym8p/5+RS81Oda7FaYMge8\
VRIFOBuNjPVsn6AqiMgVWNpArYiUlLuRjbUDJiQuLqkq/17k9iDJDnU6ucHQpHcE\
MFfxgZIlERXuOB1Cn1b3vRnS0DK2E17HaA3et5ysBc+cq5EsAtoCGLjSreUpAB9d\
rDumD3ec6gdV4yiJLJaxnGTP25wpCerdhnJ0jdOvS5fHOd3jnVccQcynxWrjs+Yi\
a1EvPyB5Vc4HFnHR7TKTMHuXuSY3mG0SSZf+xJrgMspT0cYqaikcMJPe+r+WvV40\
lYOgea+0gj0JA5l0KA2mBp22Nl/l26tXaKKiEmljzZwidQ34UdOOK1L/w+8WIJvi\
yKZ05h3BM/YXSpb0OJ55RURr/xtfVFIVmfUTuE2LmlKU2RjlXrZuXCrJwJXwVxkA\
XBbX49CWBStoluTuYhAHZ8UGSN/MhIul2dghvshQOnYZUcDVK7UDPjDICgqKExhC\
kgcZJwiANtmiCnm7WLca\n\
-----END CERTIFICATE-----\n';

// check out this https://nodejs.org/api/crypto.html#crypto_class_sign
const signRSA = function(data){
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
		obj.n = (obj.n)? obj.n : 0;
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
	console.log ("- [emulator_id](Optional) should be a number");
};

var self = module.exports = {
	getLogger : getLogger,
	getHMAC : getHMAC,
	getSHA256 : getSHA256,
	get64Hash : get64Hash,
	get32Hash : get32Hash,
	getRandomBetween : getRandomBetween,
	signRSA : signRSA,
	getTimestamp : getTimestamp,
	argvParser : argvParser,
	printHowToUse: printHowToUse
};
