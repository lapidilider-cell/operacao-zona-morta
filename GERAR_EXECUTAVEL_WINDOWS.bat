@echo off
chcp 65001 >nul
title Operacao Zona Morta - Instalador e Atualizador
echo ==============================================
echo   OPERACAO ZONA MORTA - INFERNO
echo   Instalador Windows + atualizacao automatica
echo ==============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js LTS nao encontrado. Instale em https://nodejs.org
  pause
  exit /b 1
)
echo [1/3] Instalando dependencias...
call npm install
if errorlevel 1 (
  echo Falha ao instalar dependencias. Verifique a internet e tente novamente.
  pause
  exit /b 1
)
echo [2/3] Gerando instalador Windows 64-bit...
call npm run dist
if errorlevel 1 (
  echo Falha ao gerar o instalador. Leia a mensagem acima.
  pause
  exit /b 1
)
echo.
echo [3/3] CONCLUIDO!
echo O instalador estara na pasta dist.
echo ATENCAO: a atualizacao automatica so funcionara depois de publicar uma Release no GitHub.
pause
