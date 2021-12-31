@ECHO OFF

ECHO Compiling Typescript...
call tsc

ECHO Browserify...
call browserify drawing.js app.js -p esmify -o app_web.js

ECHO DONE.