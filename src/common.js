/**
 * Common functions
 */
// all about buffer encoding!
// https://nodejs.org/docs/latest/api/buffer.html#buffer_class_method_buffer_from_string_encoding
const tools = require('./mytools.js');
const lz4 = require('lz4');
const protobuf = require("protobufjs");

const HEADER_LENGTH = 32;
const MAC_LENGTH = 64;
const MSG_TYPE = {
    MSG_JOIN: 0x54,
    MSG_REQ_SSIG: 0xB2,
	MSG_SSIG: 0xB3,
	MSG_TX: 0xB1
};
const MAX_MSG_LENGTH = 4 * 1024 * 1024; /* temporary, 4MB */

const pack = function (MSG_TYPE, data, sender_id){
	let zip_data = self.zipIt(data);
	let header = buildHeader(MSG_TYPE, zip_data, sender_id);
	let mac = buildHMAC(zip_data.body);
	return Buffer.concat([header, zip_data.body, mac], (HEADER_LENGTH + zip_data.length + MAC_LENGTH));
};

const unpack = function (data){
	let header = recoverHeader(data);
	let valid = checkHMAC(data, header);	// currently, do not check the mac.
	return recoverMsgBodyJson(data, HEADER_LENGTH, (header.total_length - HEADER_LENGTH));
}

const zipIt = function (data){
	let str_data = JSON.stringify(data);
	let input = new Buffer.from(str_data);
	let output = new Buffer.allocUnsafe( lz4.encodeBound(str_data.length) );
	let compressedSize = lz4.encodeBlock(input, output);
	output = output.slice(0, compressedSize);
	var zip_data = {
		body : output,
		length : compressedSize
	};

	return zip_data;
};

const unzipIt = function (data){
	var uncompressed = new Buffer(MAX_MSG_LENGTH);
	var uncompressedSize = lz4.decodeBlock(data, uncompressed);
	uncompressed = uncompressed.slice(0, uncompressedSize);
	return uncompressed;
}

const buildHeader = function (type_byte, zip_data, sender_id){
	var head = {
		front : headerFront(type_byte),
		total_length : headerLength(zip_data.length),
		chainid : headerChainId(1),
		sender : headerSender(sender_id),
		reserved : headerReserved()
	};

	return Buffer.concat([head.front, head.total_length, head.chainid, head.sender, head.reserved], HEADER_LENGTH);
};

const recoverHeader = function (h_buffer){
	var header = {
		G : h_buffer[0],
		version : h_buffer[1],
		msg_type : h_buffer[2],
		mac_type : h_buffer[3],
		comp_type : h_buffer[4],
		not_use : h_buffer[5],
		total_length : h_buffer.readInt32BE(6)
	};
	header.chainid = new Buffer(8);
	header.sender = new Buffer(8);
	header.reserved = new Buffer(6);

	h_buffer.copy(header.chainid, 0, 10, 18);
	h_buffer.copy(header.sender, 0, 18, 26);
	h_buffer.copy(header.reserved, 0, 26, 32);
	return header;
};

const recoverMsgBodyJson = function (body_buffer, header_length, body_length){
	let obj_buffer = new Buffer(body_length);
	body_buffer.copy(obj_buffer, 0, header_length, header_length + body_length);

	let unzipped_obj = unzipIt(obj_buffer);
	let json_obj = JSON.parse(unzipped_obj);
	return json_obj;
};

const checkHMAC = function (data, header){
	let mac_left = buildHMAC(new Buffer.from(data, HEADER_LENGTH, (header.total_length - HEADER_LENGTH)));
	let mac_right = new Buffer.from(data, header.total_length, MAC_LENGTH);
	return (mac_left === mac_right)? true:false;
};

const buildHMAC = function (zip_data){
	return new Buffer.from(tools.getHMAC(zip_data), 'hex');
};

// build front 6 bytes of the header
const headerFront = function (type_byte){
	return new Buffer.from([0x47 // 'G'
		,0x11 // major minor
		,type_byte
		,0x01 // MAC -> ECDSA
		,0x04 // zip -> lz4
		,0x00 // not used
		]);
};

const headerLength = function (length){
	let buf = Buffer.allocUnsafe(4);
	buf.writeInt32BE( (length + HEADER_LENGTH), 0);
	return buf;
};

const headerChainId = function (id){
	let buf = Buffer.allocUnsafe(8).fill(0);
	buf.writeInt32BE(1, 4);
	return buf;
};

const headerSender = function (sender_id){
	if (sender_id.length > 16) return null;

	return new Buffer.from(sender_id, 'hex');
};

const headerReserved = function (){
	return Buffer.allocUnsafe(6).fill(0);
};

const protobuf_msg_serializer = function(PROTO_PATH, msg_type_name, packed_msg){
	const root = protobuf.loadSync(PROTO_PATH);

	// Obtain a message type
	var msg_type = root.lookupType(msg_type_name);
	var payload = {message: packed_msg};
	var errMsg = msg_type.verify(payload);
	if(errMsg)
		logger.error("failed to verify payload: " + errMsg);

	var serialized_msg = msg_type.create(payload);	// byte packed msg => base64 msg
	return serialized_msg;
};

const self = module.exports = {
	pack : pack,
	unpack : unpack,
	zipIt : zipIt,
	unzipIt : unzipIt,
	protobuf_msg_serializer : protobuf_msg_serializer,
	MSG_TYPE : MSG_TYPE
};
