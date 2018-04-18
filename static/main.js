"use strict";

class API {
	constructor() {
		this.BASE_URL = "http://0.0.0.0";
	}

	_getResponse(endpoint) {
		return $.ajax({
			url: this.BASE_URL + endpoint,
			crossDomain: true,
		})
	}

	createKey(lookup, timeout) {
		return this._getResponse(
			"/createKey?lookup=" + encodeURIComponent(lookup) + "&timeout=" + timeout
		);
	}

	verify(lookup, data) {
		return this._getResponse(
			"/verify?lookup=" + lookup + "&data=" + encodeURIComponent(data) 
		);
	}

	getVerifyUrl(lookup, data) {
		return this.BASE_URL + "/verify?lookup=" + lookup + "&data=" + encodeURIComponent(data); 
	}
}

class DQR {
	constructor(timeout, canvasID, textInputID) {
		this.timeout = timeout;
		this.canvasID = canvasID;
		this.textInputID = textInputID;
		console.log("SDFS", this.canvasID);

		this.api = new API();
		this.key = "";
		this._enable = true;
		this.lookup = DQR.generateLookup();
		this.timer;

		if (timeout == undefined) { this.timeout = 1; }

		// Shorthand methods
		this.s = function(p) { return CryptoJS.enc.Utf8.stringify(p); };
		this.p = function(s) { return CryptoJS.enc.Utf8.parse(s); };
		this.hs = function(p) { return CryptoJS.enc.Hex.stringify(p); };
		this.hp = function(s) { return CryptoJS.enc.Hex.parse(s); };
		this.b64s = function(p) { return CryptoJS.enc.Base64.stringify(p); };
		this.b64p = function(s) { return CryptoJS.enc.Base64.parse(s); };
	}

	static _randString(seed, size) {
		var text = "";
		for (var i = 0; i < size; i++)
			text += seed.charAt(Math.floor(Math.random() * seed.length));
		
		return text;
	}

	static _getTime() {
		return Math.round((new Date()).getTime() / 1000);
	}

	static generateLookup() {
		var base62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		return DQR._randString(base62, 32);
	}

	getKey() {
		var _ = this;
		this.api.createKey(this.lookup, this.timeout).done(function(data) {
			_.key = data.key;
			_.timeout = data.timeout;

			_._resetTimer();
		}).fail(function(data) {
			console.log("FAILED to create key");
			console.log(data);
		});
	}

	getEncryptUrl(plaintext) {
		var time = DQR._getTime();
		var data = this.encrypt(plaintext + String(time), this.key);
		return this.api.getVerifyUrl(this.lookup, data);
	}

	generateIV() {
		var hexDigits = "abcdef0123456789";
		var iv = DQR._randString(hexDigits, 32);

		return this.hp(iv);
	}

	encrypt(data) {
		var _ = this;
		var _key = _.b64p(_.key);
		var iv = _.generateIV();

		var result = CryptoJS.AES.encrypt(data, _key, {iv: iv, mode: CryptoJS.mode.CFB});
		result = _.hp(
			_.hs(iv) + _.hs(result.ciphertext)
		);

		return _.b64s(result);
	}

	decrypt(data, key) {
		var _ = this;
		key = _.b64p(key);
		data = _.b64p(data);

		var iv = _.hp(_.hs(data).substring(0,32));
		data = _.hp(_.hs(data).substring(32));

		var cipher = CryptoJS.lib.CipherParams.create({
			ciphertext: data
		});

		var result = CryptoJS.AES.decrypt(cipher, key, {iv: iv, mode: CryptoJS.mode.CFB});
		console.log(result);
		return _.s(result);
	}

	redrawDQR() {
		// Reset output images in case of early termination
		var canvas = document.getElementById(this.canvasID);
		canvas.style.display = "none";

		// Get text input and compute QR Code
		var ecl = qrcodegen.QrCode.Ecc.LOW;
		var text = document.getElementById(this.textInputID).value;
		var url = this.getEncryptUrl(text);
		console.log("VERIFY", url);
		var segs = qrcodegen.QrSegment.makeSegments(url);
		var qr = qrcodegen.QrCode.encodeSegments(segs, ecl, 7, 40, -1, true);

		// Draw output, 4 module border, 8 pixels per module
		qr.drawCanvas(8, 4, canvas);
		canvas.style.removeProperty("display");
	}

	_resetTimer() {
		var _ = this;
		clearInterval(_.timer);
		if (_._enable) {
			_.timer = setInterval(function() { _.redrawDQR(); }, _.timeout * 1000);
		}
	}

	enable() {
		this._enable = true;
		this._resetTimer();
	}

	disable() {
		this._enable = false;
		this._resetTimer();
	}
}

var dqr = new DQR(1, "qrcode-canvas", "text-input");
$(document).ready(function() {
	dqr.getKey();
	$('#disable').change(function() {
		if (this.checked) {
			dqr.disable();
		} else {
			dqr.enable();
		}
	});
});

