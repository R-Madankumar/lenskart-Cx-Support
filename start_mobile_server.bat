@echo off
title Lenskart CX Mobile Server
cd /d "%~dp0"
echo Starting Lenskart CX Mobile Server...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
