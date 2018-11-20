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
	const REMOTE_SERVER = '0.0.0.0:50051';
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
	channel.write(passport);

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
function doSign(block_header){
	logger.debug ("... I need to sign on hgt " + block_header.hgt);
	let my_sig = genSig(passport, block_header);
	if(channel)
	{
		client.SigSend(my_sig, res => {});
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
	pp.cert = `-----BEGIN RSA PRIVATE KEY-----
MI12ogIBAAKCAQEAsJAu5Db2Sk/JZPkN2fYshohemy+B5AfRANGz0wUMl3YJeV0pGby0680J19Kn
s1zM2F4NzX+6cRXIXhoK83BbWTSPu3EfNWtdbM29YmLdYY2nvEN5oImwYy1Qv27CIx9dXU6myFfL
O4DF3512145F9/YqPw1NVul9nrR/pEbsrnTKVUGbFCslM8TbfD5a5ZQa6ovWHVrUcOB0X6OfYhRX
AxLFe4KtfCs/8mVA0YPuk1Kb4o35oIEe9deLDE5XA7NNelk9CfNL92l1pbiRQzdVYhin4U30/ImN
8QqjeyRMXVlJRuPm0agS8YHKRdzfbdfglmkl5Z/66pSXAPpy3KWmVwIDAQABAoIBAGlVe0QXLhPj
Saj9lC/mV2XjUV2PmBQsPZoZgQhxSLPLbZeD5pM+K0lJx4eEWxv8TxD9+4oPm3D/p8vMCaB19Wlg
nCcdM5sw9Em67G0as0700ashhmReAGcKj9PFBfjiK1cRJxr6lXpoNjDqAi2aua9Wopl/HBavsYvO
7x9YWLcyYCi0aemTu56c/6SWpu1Ev1KmUfb7dg2340afkkb4M0ZGH+pzeTE9FWD4RCiqhcMDrCQV
uF78QynLLYgU1ni/aaaaaaaaaaaaaaaaaaacsJ0uOAWLMk193RdhrOYemSRuZCPL8t0qC3jsrM8m
CHt4IzqpNPIcSFoT5lVMW6p+iGECgYEA/aUwxKWn3dvRy0frcfb6UubmLtsox34r3vWWIpNbEFQ4
YMC06OuUo4Jdm+ohm/lInDh0OQTYLvDOfhksM4Pus6k7/25V0LmP9ZiPS5f4AoPn4Gt7TEkdZrnm
xmwb3DaRkfKI4mNYrejHlDQH7dIZHlBwu0yas11145lk5pgTRokCgYEAsjPM9WOQpCJzfLpTfT/6
Hpq0JVTizYyT/63EsTYAdDmxgjrJw1RFAp6w0/mv1Lg6OJq6RYVNVcG1zuVeJpr60Pe94JgVCIC9
OMoZ+p14tl3qqLbLNXHTuFep7mynkFvzOmLTRGGMoyAqadsfasdfnjSpInrdsduPPjfbtjGETd8C
gYAQWBenZEFH44VGQxEh29dPhj9o34hmKnQrPsn441sa1fadf4tQwvVl/92GUXTu9wY9wsmCbxR7
GdtEdtzJSQQVoZ8TG4n+FCb5nWYGafl6OAO2C1b7mG6DkxES0h6Ndxq0O9ukMuCg/DH4E846/eHO
eUJ6Xzmr7Cx5njZnKH99eQKBgBEmQQxAh7P0CM8xE0XTeVsdafasklfnjkDjZTF0s/h7cOTKiY49
asdfasdkfmkladngklankdgakldnfklasnfasdfasdfadfaMrFFdBDfws9uGs+mxyaFM9nKWjE2t
O6wbxJ8pECLGvraSiFVIJqxfZnOGBX3PVmqzb3aKL2RbAoGAUfJqrxwNm7ZONB4qKUBCY1M1mJWk
mBKw8xWG44/udO72Uqda6ktK537iHHP33/zNucgnka2/sofHmCsNHkHx9Gt6+LJ6Gv37PmJfmf0s
sdfkipqi0jpin2iiHHio23hruofboAsUSMJRNV5of0fhygnXMLwzD9HgksoscaWOlUw=
-----END RSA PRIVATE KEY-----`;
	return pp;
}