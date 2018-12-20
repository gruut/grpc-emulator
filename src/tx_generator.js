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
var n_tx = 0;

/**
 * Starts tx_generator
 */
function main() {
    argv = tools.argvParser(process.argv);
    if( !argv.ok) {
		tools.printHowToUse();
		return false;
	}

    const REMOTE_SERVER = argv.addr + ":" + argv.port;
	client = new proto_tx.GruutSeService(REMOTE_SERVER,
                                       grpc.credentials.createInsecure());

    tx_send(argv.n);
}

main();


/**
 * Do Details
 */
function tx_send(se_num) {
    var tx = genTx(se_num);
    logger.info(" req  #" + n_tx);
    logger.info(JSON.stringify(tx));

    // SEID: txbody에는 base64인코딩으로, 헤더에는 64bit바이너리로 사용
    var tx_pack = common.pack(common.MSG_TYPE.MSG_TX, tx, tools.getSEID(se_num));
    const msg = common.protobuf_msg_serializer(TX_PROTO_PATH, "grpc_se.GrpcMsgTX", tx_pack);
    client.transaction(msg, res => {
        logger.debug("I got this res: " + JSON.stringify(res));
    });

	setTimeout(function(){tx_send(se_num);}, 100);
}

function genTx(se_num){
    ++n_tx;

    let rID = tools.getSEID(se_num);
    let ts = tools.getTimestamp();
    let cID = "Client #" + n_tx; // random client ID

    var tx = {};
    tx.txid = tools.getSHA256(rID + n_tx);
    tx.time = ts;
    tx.rID = rID;
    tx.type = "DIGESTS";
    tx.content = genContents(cID, ts);

    let bf_tx = common.buildSigBuffer(tx);
    let rSig = tools.signRSA(bf_tx);

    //string rID to base64
    tx.rID = Buffer.from(rID).toString('base64');
    tx.rSig = rSig;

	return tx;
}

function genContents(cID, ts){
    let contents = [];
    let n = tools.getRandomBetween(0,10);
    let item;
    let i;
    switch (n){
        case 2:
        case 3:
        case 10:
        for(i=0; i<n; i++){
            addSingleContent(contents, cID, ts, i);
        }
        break;
        default:
            addSingleContent(contents, cID, ts, 0);
        break;
    }

    return contents;
}

function addSingleContent(contents, cID, ts, n){
    let data = "Data #" + n_tx + ((n==0)? "" : "-" + n);
    let dataID = tools.get64Hash(data + n_tx);
    contents.push(cID);
    contents.push(ts);
    contents.push(dataID);
    contents.push(data);
}
