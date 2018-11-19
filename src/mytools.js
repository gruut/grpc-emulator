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
	return Buffer.from((crypto.createHash('sha256').update(data).digest('hex')).substr(0, 16), 'hex').toString('base64');
};

var get32Hash = function(data){
	return Buffer.from((crypto.createHash('sha256').update(data).digest('hex')).substr(0, 8), 'hex').toString('base64');
};

var getRandomBetween = function(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

var self = module.exports = {
	getLogger : getLogger,
	getHMAC : getHMAC,
	getSHA256 : getSHA256,
	get64Hash : get64Hash,
	get32Hash : get32Hash,
	getRandomBetween : getRandomBetween
};