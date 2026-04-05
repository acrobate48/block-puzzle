@echo off
cd /d "%~dp0"
echo Lancement de Block Puzzle...
"C:\Users\Admin\AppData\Local\Programs\Python\Python313\python.exe" puzzle_blocks.py 2>errors.log
if errorlevel 1 (
    echo.
    echo === ERREUR ===
    type errors.log
    echo.
    pause
)
