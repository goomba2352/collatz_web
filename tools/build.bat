:: How to use: run this build tool from the main directory, i.e.
:: invoke this with .\tools\build.bat 
::
:: Requirements: 'tsc' and 'browserify' are installed and can be referenced
@ECHO OFF

ECHO Compiling Typescript...
call tsc

ECHO Browserify...
cd src
call browserify ts-out/app.js -p esmify -o ../web/app_web.js

ECHO DONE.