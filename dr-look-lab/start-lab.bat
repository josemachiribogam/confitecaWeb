@echo off
cd /d %~dp0
start "" http://localhost:8123/
python -m http.server 8123 --bind 127.0.0.1
