import base64
import random
import hashlib
import time

from flask import Flask, request, jsonify, redirect, render_template
from flask_cors import CORS

# Local Files
import validate

from AESCipher import AESCipher


app = Flask(__name__)
CORS(app)

lookup_table = dict()


@app.route('/')
def index():
    return render_template('index.html')


def _create_error_message(message, error_code, **kwargs):
    return jsonify({
        "message": message,
        "error_code": error_code,
        **kwargs
    }), error_code


def _create_encryption_key():
    return hashlib.sha256(str(random.getrandbits(256)).encode('utf-8')).digest()


@app.route('/createKey')
def create_key():
    lookup = request.args.get('lookup', '')
    timeout = request.args.get('timeout', '5')
    validate.lookup(lookup)
    validate.timeout(timeout)

    timeout = int(timeout)
    key = _create_encryption_key()

    lookup_table[lookup] = {
        'key': key,
        'timeout': timeout
    }

    return jsonify({
        'key': base64.b64encode(key).decode(),
        'timeout': timeout,
    })


def _get_current_time():
    return time.time()


def _has_dqr_expired(dqr_time, timeout):
    return abs(_get_current_time() - dqr_time) > timeout + 3


def _extract_dqr_data(key, data):
    cipher = AESCipher(key)
    timeData = cipher.decrypt(data).decode()
    time, data = int(timeData[-10:]), timeData[:-10]

    return time, data


@app.route('/verify')
def verify():
    lookup = request.args.get('lookup', '')
    data = request.args.get('data', '')
    validate.lookup(lookup)
    validate.data(data)

    if lookup not in lookup_table:
        return _create_error_message("Key has not yet been created", 400, lookup=lookup)

    lookup_data = lookup_table[lookup]
    key, timeout = lookup_data['key'], lookup_data['timeout']

    time, data = _extract_dqr_data(key, data)

    if (_has_dqr_expired(time, timeout)):
        return _create_error_message("DQR code has expired", 400)

    if validate.is_url(data):
        return redirect(data, code=302)

    return jsonify({'data': data})


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)

