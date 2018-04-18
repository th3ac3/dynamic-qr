import re

from flask import make_response, abort

def lookup(lookup):
    if len(lookup) != 32:
        abort(make_response(("Lookup is not correct length (32).", 400, '')))

def timeout(timeout):
    if not timeout or not int(timeout):
        abort(make_response(("Timeout is not an integer.", 400, '')))
    timeout = int(timeout)

    # Timeout between 1s and 5minutes
    if not (1 <= timeout <= 300):
        abort(make_response(("Timeout is not a valid time (1 to 300 seconds)", 400, '')))

def data(data):
    if not data:
        abort(make_response(("Can't decrypt without any provided data", 400, '')))

def is_url(text):
	regex = re.compile(
		r'^(?:http|ftp)s?://' # http:// or https://
		r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|' #domain...
		r'localhost|' #localhost...
		r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})' # ...or ip
		r'(?::\d+)?' # optional port
		r'(?:/?|[/?]\S+)$', re.IGNORECASE)
	
	return re.match(regex, text) is not None

