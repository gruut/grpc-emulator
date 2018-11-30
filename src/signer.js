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
var logger = tools.getLogger('signer');

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

var channel = null;
var client = null;
var passport = null;

/**
 * Starts client - the signer
 */
function main() {
	const REMOTE_SERVER = '165.246.196.48:50051';
	client = new proto_pull_merger.Pulling(REMOTE_SERVER,
                                       grpc.credentials.createInsecure());

	// stand by for the stream mode
	var p_num = (process.argv.length == 3)? process.argv[2] : 0;
	standBy(client, p_num);
}

main();


/**
 * Implements the RPC methods.
 */
function standBy(client, p_num){
	passport = getMyPassport(p_num);
	channel = client.join();
	var pp_pack = common.pack(common.MSG_TYPE.MSG_JOIN, passport, passport.sID);
	const msg = common.protobuf_msg_serializer(PULL_MERGER_PROTO_PATH, "Merger.Identity", pp_pack);
	channel.write(msg);

	channel.on("data", doSign);
	channel.on("end", ()=>{
		logger.info ("the channel has closed by the server");
	})
	channel.on("error", ()=>{
		logger.error ("the server is DEAD... please call 911... ");
	});
}

/**
 * Do Details
 */
function doSign(buffered_response){
	let sig_msg = common.unpack(buffered_response.message);
	console.log(JSON.stringify(sig_msg));
	logger.debug ("... I need to sign on hgt " + sig_msg.hgt);
	let my_sig = genSig(passport, sig_msg);
	if(channel)
	{
		let sig_pack = common.pack(common.MSG_TYPE.MSG_SSIG, my_sig, passport.sID);
		const msg = common.protobuf_msg_serializer(PULL_MERGER_PROTO_PATH, "Merger.TxReply", sig_pack);

		client.SigSend(msg, res => {});
	}
}

function genSig(passport, block_header){
	var res = new Object();
	res.time = Math.floor(Date.now() / 1000);
	res.sID = passport.sID;
	res.sig = tools.get32Hash(JSON.stringify(block_header) + passport.sID);

	return res;
}

function getMyPassport(p_num){
	let pp = new Object();
	pp.sID = tools.get64Hash("Signer # " + ((p_num != 0 )? p_num : tools.getRandomBetween(0,1000000)));
	// fake pem
	pp.cert ="..................cert............................";
	return pp;
}
