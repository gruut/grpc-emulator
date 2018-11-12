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
function sayHello(call, callback) {
	callback(null, {message: 'Hello ' + call.request.name});
}

function tx(call, callback) {
	console.log (call.request);
	callback(null, {message: '' + call.request.name});
}

function broadcast(call, callback) {
	callback(null, { response: "" });
}


/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
  var server = new grpc.Server();
  server.addService(proto_pull_merger.Pulling.service, {sayHello: sayHello});
  server.addService(proto_pull_merger.Pulling.service, {Tx: tx});
  server.addService(proto_pull_merger.Pulling.service, {Broadcast: broadcast});

  // how to create secure credentials?
  server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
  server.start();
}

main();

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
        filename: `${logDir}/.log`,
        timestamp: tsFormat,
        datePattern: 'yyyy-MM-dd',
        prepend: true,
      })
    ]
  });
}