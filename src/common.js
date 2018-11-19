/**
 * Common functions
 */
// all about buffer encoding!
// https://nodejs.org/docs/latest/api/buffer.html#buffer_class_method_buffer_from_string_encoding
const tools = require('./mytools.js');
const lz4 = require('lz4');

const HEADER_LENGTH = 32;
const MAC_LENGTH = 64;
const MSG_TYPE = {
    MSG_JOIN: 0x54,
    MSG_REQ_SSIG: 0xB2,
    MSG_SSIG: 0xB3
};

var buildMsg = function (MSG_TYPE, data, sender_id){
	let zip_data = self.zipIt(data);

	let header = buildHeader(MSG_TYPE, zip_data, sender_id);
	let mac = buildHMAC(zip_data);

	const buffer = Buffer.concat([header, zip_data.body, mac], (HEADER_LENGTH + zip_data.length + MAC_LENGTH));

	return buffer;
};

// zip the stringified json object
// stringify하지 않고 데이터의 길이를 알 수 있는 방법은?
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

const buildHeader = function (type_byte, zip_data, sender_id){
	var head = {
		front : headerFront(type_byte),
		total_length : headerLength(zip_data.length),
		chainid : headerChainId(1),
		sender : headerSender(sender_id),
		reserved : headerReserved()
	};

	const head_buffer = Buffer.concat([head.front, head.total_length, head.chainid, head.sender, head.reserved], HEADER_LENGTH);

	return head_buffer;
};

const buildHMAC = function (zip_data){
	return Buffer.from(tools.getHMAC(zip_data.body), 'hex');
};

// build front 6 bytes of the header
const headerFront = function (type_byte){
	return Buffer.from([0x47 // 'G'
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
	if (sender_id.length > 8) return null;

	return Buffer.from(new String(sender_id));
};

const headerReserved = function (){
	return Buffer.allocUnsafe(6).fill(0);
};

const self = module.exports = {
	buildMsg : buildMsg,
	zipIt : zipIt,
	MSG_TYPE : MSG_TYPE
};
