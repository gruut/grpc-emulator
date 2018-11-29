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

var TX_PROTO_PATH = __dirname + '/../protos/tx.proto';

// hello world에 있길래 사용함.
var LOAD_ARGS = {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true
};

var TXPackageDefinition = protoLoader.loadSync(
    TX_PROTO_PATH, LOAD_ARGS
);

var proto_tx = grpc.loadPackageDefinition(TXPackageDefinition).grpc_se;

var client = null;
var p_num = 0;
var txid = 0;

/**
 * Starts client - the signer
 */
function main() {
     
    //const REMOTE_SERVER = '165.246.196.48:50051';
    const REMOTE_SERVER = '10.10.10.117:50051';
	client = new proto_tx.GruutSeService(REMOTE_SERVER,
                                       grpc.credentials.createInsecure());

	// stand by for the stream mode
    var p_num = (process.argv.length == 3)? process.argv[2] : 0;
    tx_send();
}

main();


/**
 * Do Details
 */
function tx_send() {
	
    var tx = genTx();
    logger.info(" req  #" + txid); 
    logger.info(JSON.stringify(tx));

    var tx_pack = common.pack(common.MSG_TYPE.MSG_TX, tx, tx.rID);
    const msg = common.protobuf_msg_serializer(TX_PROTO_PATH, "grpc_se.GrpcMsgTX", tx_pack);
    client.transaction(msg, res => {
        logger.debug("I got this res: " + JSON.stringify(res));
    });


	setTimeout(tx_send, 2000);
}


function genTx(){
    ++txid;

    let rID = tools.get64Hash("TX GENERATOR # " + p_num );
    let ts = tools.getTimestamp();
    let data = "Data #" + txid;
    let datID = tools.get64Hash(data + txid);

    var tx = new Object();
	tx.txid = tools.getSHA256(rID + txid);
    tx.time = ts;
    tx.rID = rID;
    tx.type = "digests";
    tx.content = [ rID, ts, datID, data ];
    tx.rSig = tools.signRSA(data);

	return tx;
}
