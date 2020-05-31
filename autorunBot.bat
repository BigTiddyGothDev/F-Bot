echo off
cls
echo %CD%
#pause
cls

:loop
color 0A
:: I just prefer matrix-style terminals...
cls
call node bot.js
if %ERRORLEVEL% NEQ 0 ( ::pauses if didn't exit smoothly, recommended only if bot not on a remote machine
color 0C
echo.
echo.
echo Bot exited with error code %ERRORLEVEL%
  pause
)

echo restarting...
timeout /t 1 /nobreak

goto loop
