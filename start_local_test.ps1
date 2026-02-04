# Quick Local Test Launcher
# This script starts the server and opens two browser windows for testing

Write-Host "=== Local Multi-User Test Launcher ===" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
$serverFile = "server.js"
if (-not (Test-Path $serverFile)) {
    Write-Host "ERROR: server.js not found in current directory" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "Starting local server..." -ForegroundColor Cyan
Write-Host ""

# Start server in background
$serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -PassThru

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check if server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3300" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Server is running!" -ForegroundColor Green
}
catch {
    Write-Host "WARNING: Server might not be ready yet" -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Opening Test Browsers ===" -ForegroundColor Cyan
Write-Host ""

# Open Chrome (User A - Offender)
Write-Host "Opening Chrome for User A (Offender)..." -ForegroundColor White
Start-Process "chrome.exe" -ArgumentList "http://localhost:3300", "--new-window"
Start-Sleep -Seconds 1

# Open Edge (User B - Victim)
Write-Host "Opening Edge for User B (Victim)..." -ForegroundColor White
Start-Process "msedge.exe" -ArgumentList "http://localhost:3300", "--new-window"

Write-Host ""
Write-Host "=== Test Environment Ready! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Two browser windows have been opened:" -ForegroundColor Cyan
Write-Host "  - Chrome: User A (Offender)" -ForegroundColor White
Write-Host "  - Edge: User B (Victim)" -ForegroundColor White
Write-Host ""
Write-Host "Test Accounts (if you created them):" -ForegroundColor Yellow
Write-Host "  User A: offender@test.com / test1234" -ForegroundColor Gray
Write-Host "  User B: victim@test.com / test1234" -ForegroundColor Gray
Write-Host ""
Write-Host "Server URL: http://localhost:3300" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "  - Use Win+Left/Right to split windows side by side" -ForegroundColor White
Write-Host "  - Press F12 in browsers to open Developer Tools" -ForegroundColor White
Write-Host "  - Check server terminal for logs" -ForegroundColor White
Write-Host ""
Write-Host "To stop the server:" -ForegroundColor Red
Write-Host "  - Close the server PowerShell window" -ForegroundColor White
Write-Host "  - Or press Ctrl+C in the server window" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit this window (server will keep running)"
