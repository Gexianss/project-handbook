@echo off
cd /d "%~dp0"
start "" http://localhost:8787
node serve.cjs 8787
