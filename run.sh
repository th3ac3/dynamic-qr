#!/bin/sh

export FLASK_APP="main.py"
sudo -E flask run --host=0.0.0.0 --port=80

