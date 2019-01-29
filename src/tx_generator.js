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
var packer = require("./packer.js");
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

/**
 * 전역변수 모음
 */
var tx_senders = [];
var n_tx = 0;
const TPS = 100;
const REPEAT_AFTER = 1000/TPS;
const Mergers = ['127.0.0.1'];


/**
 * Start tx_generator
 */
function main() {
    argv = tools.argvParser(process.argv);
    if( !argv.ok) {
        tools.printHowToUse();
        return false;
    }

    // ignore argv.addr since Merger IPs fixed
    // TO DO:: make a config file which contains Merger IPs and the port
    for (var i=0; i<Mergers.length; i++) {
        var REMOTE_SERVER = Mergers[i] + ":" + argv.port;
        tx_senders.push(new proto_tx.GruutSeService(REMOTE_SERVER,
        grpc.credentials.createInsecure()));
    }

    tx_broadcast(argv.n);
}

main();


/**
 * Do Details
 */
function tx_broadcast(se_num) {
    var tx = genTx(se_num);
    //logger.info(" [req #" + n_tx) + "]";

    // SEID: txbody에는 base64인코딩으로, 헤더에는 64bit바이너리로 사용
    var tx_pack = packer.pack(packer.MSG_TYPE.MSG_TX, tx, tools.getSEID(se_num));
    const msg = packer.protobuf_msg_serializer(TX_PROTO_PATH, "grpc_se.Request", tx_pack);
    for(var i=0; i<tx_senders.length; i++){
         tx_senders[i].seService(msg, res => {
			//process.stdout.write(".");
            logger.debug(" [res #" + n_tx +"] " + JSON.stringify(res));
        });
    }

	setTimeout(function(){ tx_broadcast(se_num); }, REPEAT_AFTER);
}

function genTx(se_num){
    ++n_tx;

    let rID = tools.getSEID(se_num);
    let ts = tools.getTimestamp();
    let cID = "Client #" + n_tx; // random client ID

    var tx = {};
    tx.time = ts;
    tx.rID = rID;
    tx.type = "DIGESTS";
    tx.content = genContents(cID, ts);
	tx.txid = packer.txidBuilder(tx);

    let bf_tx = packer.buildSigBuffer(tx);
    let rSig = tools.doSign(bf_tx);

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
    let dataID = "D#" + n_tx + ((n==0)? "" : "-" + n);
    let data = tools.getRandomBase64(32);
    contents.push(cID);
    contents.push(ts);
    contents.push(dataID);
    contents.push(data);
}
