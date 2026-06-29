@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  מפעיל את לומדת סוד המשפט...
echo.
node server.js
if errorlevel 1 (
  echo.
  echo  שגיאה: Node.js לא מותקן.
  echo  הורד מ: https://nodejs.org
  pause
)
