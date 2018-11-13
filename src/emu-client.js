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

var proto_pull_merger = grpc.loadPackageDefinition(pullPackageDefinition).pull_merger;

/**
 * Implements the RPC methods.
 */
var channel = null;
function stanBy(client){
	channel = client.Join({nid:"signer's nid", cert:"base64 str"});
	channel.on("data", doSign);
}

function doSign(header){
	// Check this is my work or not
	var my_sig = genSig();
	if(channel)
	{
		channel.sigSend(my_sig);
	}
}

/**
 * Starts client - the signer
 */
function main() {
	const REMOTE_SERVER = '13.125.119.50:50051';
	var client = new proto_pull_merger.Merger.Pulling(REMOTE_SERVER,
                                       grpc.credentials.createInsecure());
									   
	standBy(client);
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

	const tsFormat = () => (new Date()).toLocaleTimeString();

	return new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
       timestamp: tsFormat,
       colorize: true,
       level: 'info'
     }),
      new (require('winston-daily-rotate-file'))({
        level: 'info',
        filename: `${logDir}/client-.log`,
        timestamp: tsFormat,
        datePattern: 'yyyy-MM-dd',
        prepend: true,
      })
    ]
  });
}

function genSig(){
	var res = new Object();
	res.time = new Date();
	res.sID = get64Hash("Signer #" + 1);
	res.sig = get32Hash("WHAT A GREATE SIGNATURE");

	return res;
}
