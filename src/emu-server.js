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

var HEIGHT = 0;
var MID = 0;
var BID = 0;

var pullPackageDefinition = protoLoader.loadSync(
		PULL_MERGER_PROTO_PATH, LOAD_ARGS
    );


var proto_pull_merger = grpc.loadPackageDefinition(pullPackageDefinition).Merger;

/**
 * Implements the RPC methods.
 */
function sayHello(call, callback) {
	callback(null, {message: 'Hello ' + call.request.name});
}

// merger sends his tx to signers
function sigRequest(call, callback) {
	var req = buildRequest();

	// Assign signer - skipped
	signers.forEach(signer => {
		signer.write(req);
	});
}

function broadcast(call, callback) {
	//callback(null, { response: "" });
}

var signers = [];
var certs = [];

function join(call, callback){
	signers[call.request.sid] = call;	// save call itself!
	certs[call.request.sid] = call.request.cert;
	
	// No replies when joining
	call.write({});
}

function sigResponse(call, callback){
	// Receives signers' signature
	// do whatever.
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
  var server = new grpc.Server();
  server.addService(proto_pull_merger.Pulling.service, {  sayHello: sayHello
  														, join: join
  														, sigRequest: sigRequest
  														, sigSend: sigResponse
  														, broadcast: broadcast });
  // how to create secure credentials?
  server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
  server.start();
}

main();

/**
 * Implements Utility Functions
 */
function getLogger(){
	const logDir = 'logs';
	if (!fs.existsSync(logDir)) {
		fs.mkdirSync(logDir);
	}
	var options = {
		file: {
			level: 'info',
			name: 'server.info',
			filename: `logs/app.log`,
			handleExceptions: true,
			json: true,
			maxsize: 5242880, // 5MB
			maxFiles: 100,
			colorize: true,
		},
		errorFile: {
			level: 'error',
			name: 'server.error',
			filename: `logs/error.log`,
			handleExceptions: true,
			json: true,
			maxsize: 5242880, // 5MB
			maxFiles: 100,
			colorize: true,
		},
		console: {
			level: 'debug',
			handleExceptions: true,
			json: false,
			colorize: true,
		}
	};

	const tsFormat = () => (new Date()).toLocaleTimeString();

	return winston.createLogger({
		transports: [
			new (winston.transports.File)(options.errorFile),
			new (winston.transports.File)(options.file)
		],
		exitOnError: false, // do not exit on handled exceptions
	});
}

function buildRequest(){
	var req = new Object();
	req.time = new Date();
	req.mid = get64Hash("Merger #" + 1);
	req.cID = get32Hash("Local Chain #1");
	req.hgt = ++HEIGHT;
	req.txRoot = getSHA256(JSON.stringify(req));

	return req;
}

function getSHA256(data){
	return crypto.createHash('sha256').update(data).digest('base64');
}

function get64Hash(data){
	return Buffer.from(substr(crypto.createHash('sha256').update(data).digest('hex'), 0, 16), 'hex').toString('base64');
}

function get32Hash(data){
	return Buffer.from(substr(crypto.createHash('sha256').update(data).digest('hex'), 0, 8), 'hex').toString('base64');
}

function getRandomBetween(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

