@echo off
cd /d "C:\Projects\_SHARED\tools"
start http://localhost:8787/PrePromptEngine.html
npx http-server . -p 8787 -c-1
