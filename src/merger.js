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
var tools = require("./mytools.js");
var common = require("./common.js");
var logger = tools.getLogger('merger');

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

	call.on("data", (buffered_response)=>{
		let response = common.unpack(buffered_response.message);
		addSigner(response, call);
	});

	call.on("error", (err)=>{
		logger.error(JSON.stringify(err)); 
	});

	if (signers.length == 0 && HEIGHT == 0 )
		askSignature();
}

function askSignature() {
	if(signers.length > 0 ){
		var req = buildRequest();
		logger.info(" req signature has ready #" + req.hgt);

		var req_pack = common.pack(common.MSG_TYPE.MSG_REQ_SSIG, req, tools.get64Hash("MERGER-0"));
		const msg = common.protobuf_msg_serializer(PULL_MERGER_PROTO_PATH, "Merger.TxRequest", req_pack);

		signers.forEach(signer => {
			signer.call.write(msg);
		});
	}

	setTimeout(askSignature, 2000);
}

function collectSignature(call, callback){
	let sig_contents = common.unpack(call.request.message);
	logger.info("signature [" + sig_contents.sig + "] has received. signed by #" + sig_contents.sID);
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
	let obj = new Object();
	try{
		logger.info("A signer's passport has arrived: sID = " + passport.sID);
		obj.sID = passport.sID;
		obj.cert = passport.cert;
	}
	catch (e){
		obj.sID = "tmp sid";
		obj.cert = "tmp cert";
	}
	obj.call = call;

	signers.push(obj);
}

function buildRequest(){
	var req = new Object();
	req.time = Math.floor(Date.now() / 1000);
	req.mid = tools.get64Hash("Merger #" + 1);
	req.cID = tools.get32Hash("Local Chain #1");
	req.hgt = ++HEIGHT;
	req.txRoot = tools.getSHA256(JSON.stringify(req));

	return req;
};
