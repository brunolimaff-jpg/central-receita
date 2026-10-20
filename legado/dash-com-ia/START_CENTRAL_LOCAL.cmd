@echo off
setlocal EnableExtensions

rem Sempre operar a partir da pasta deste arquivo, mesmo com espacos no caminho.
cd /d "%~dp0"
title Central de Receita - inicializacao local

where node >nul 2>nul
if errorlevel 1 (
  echo [BLOQUEIO] Node.js nao foi encontrado no PATH.
  goto :falha
)

set "BLOQUEIOS=0"

if not exist "%~dp0src\app\page.tsx" (
  echo [BLOQUEIO] Falta a tela inicial src\app\page.tsx.
  set "BLOQUEIOS=1"
)
if not exist "%~dp0src\components\central\navegacao.tsx" (
  echo [BLOQUEIO] Falta src\components\central\navegacao.tsx.
  set "BLOQUEIOS=1"
)
if not exist "%~dp0src\components\central\proveniencia-inline.tsx" (
  echo [BLOQUEIO] Falta src\components\central\proveniencia-inline.tsx.
  set "BLOQUEIOS=1"
)
if not exist "%~dp0node_modules\next\dist\bin\next" (
  echo [BLOQUEIO] Instalacao local do Next.js incompleta: node_modules\next\dist\bin\next nao existe.
  if exist "%~dp0bun.lock" (
    where bun >nul 2>nul
    if not errorlevel 1 (
      echo Para restaurar as dependencias fixadas: bun install --frozen-lockfile
    ) else (
      echo O projeto inclui bun.lock, mas Bun nao esta no PATH.
      echo Instale Bun para respeitar o lock; alternativa local: npm install --package-lock=false
    )
  ) else (
    echo Restaure as dependencias do projeto com o gerenciador usado neste checkout.
  )
  set "BLOQUEIOS=1"
)

if "%BLOQUEIOS%"=="1" goto :falha

node "%~dp0scripts\start-central-local.mjs"
if errorlevel 1 goto :falha

endlocal
exit /b 0

:falha
echo.
echo A Central nao foi iniciada. Corrija os bloqueios indicados e tente novamente.
echo.
pause
endlocal
exit /b 1
