/*
 *
 * Copyright 2015 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/* packages */
var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var winston = require('winston');
require('date-utils');
const fs = require('fs');
var crypto = require('crypto');
var logger = getLogger();
var PULL_MERGER_PROTO_PATH = __dirname + '/../protos/pull_merger.proto';

// hello world에 있길래 사용함.
var LOAD_ARGS = {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true
};

var pullPackageDefinition = protoLoader.loadSync(
		PULL_MERGER_PROTO_PATH, LOAD_ARGS
    );


var proto_pull_merger = grpc.loadPackageDefinition(pullPackageDefinition).Merger;

var HEIGHT = 0;
var signers = [];

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
	var server = new grpc.Server();
	server.addService(proto_pull_merger.Pulling.service, { join: join
														 , sigSend: collectSignature
														});
	// how to create secure credentials?
	server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
	server.start();
}

main();

/**
 * Implements the RPC methods.
 */
// When the channel has created, assign function on each events.
function join(call){
	call.on("end", ()=>{
		removeSigner (call);
	});

	call.on("data", (response)=>{
		addSigner(response, call);
	});

	call.on("error", (err)=>{
		logger.error(JSON.stringify(err)); 
	});

	if (signers.length == 0 && HEIGHT == 0  )
		askSignature();
}

function  askSignature() {
	if(signers.length > 0 ){
		var req = buildRequest();

		// Assign signers - skipped
		signers.forEach(signer => {
			signer.call.write(req);
		});
	}

	setTimeout(askSignature, 2000);
}

function collectSignature(call, callback){
	logger.info("signature received. signed by #" + call.request.sID);
}

/**
 * Do Details
 */
function removeSigner(call){
	for (let i=0; i<signers.length; i++){
		let signer = signers[i];
		if (signer.call == call){
			logger.info("The signer " + signer.sID + " has disconnected...--");
			signers.splice (i, 1);
			break;
		}
		else{
			logger.error("A signer has left. But it was not able to delete her.");
		}
	}
}

function addSigner(passport, call){
	logger.info("A signer's passport has arrived: sID = " + passport.sID);

	let obj = new Object();
	obj.sID = passport.sID;
	obj.cert = passport.cert;
	obj.call = call;

	signers.push(obj);
}

/**
 * Implements Utility Functions
 */
// https://stackoverflow.com/questions/32131287/how-do-i-change-my-node-winston-json-output-to-be-single-line
function getLogger(){
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
			filename: 'logs/app.log',
			handleExceptions: true,
			maxsize: 5242880, // 5MB
			maxFiles: 100,
		},
		errorFile: {
			level: 'error',
			name: 'server.error',
			filename: 'logs/error.log',
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
}

function buildRequest(){
	var req = new Object();
	req.time = Math.floor(Date.now() / 1000);
	req.mid = get64Hash("Merger #" + 1);
	req.cID = get32Hash("Local Chain #1");
	req.hgt = ++HEIGHT;
	req.txRoot = getSHA256(JSON.stringify(req));

	logger.debug(JSON.stringify(req));
	return req;
}

function getSHA256(data){
	return crypto.createHash('sha256').update(data).digest('base64');
}

function get64Hash(data){
	return Buffer.from((crypto.createHash('sha256').update(data).digest('hex')).substr(0, 16), 'hex').toString('base64');
}

function get32Hash(data){
	return Buffer.from((crypto.createHash('sha256').update(data).digest('hex')).substr(0, 8), 'hex').toString('base64');
}

function getRandomBetween(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

