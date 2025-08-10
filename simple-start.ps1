# Simple BidFlow Server Starter
Write-Host "🚀 Starting BidFlow Development Server..." -ForegroundColor Green

# Kill any existing node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "📦 Starting Next.js server on port 3100..." -ForegroundColor Yellow
Write-Host "Please wait 10-15 seconds for the server to fully start..." -ForegroundColor Cyan

# Start the server in background job
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npx next dev --port 3100
}

# Wait for server to start
Start-Sleep -Seconds 15

# Test connection
Write-Host "🔍 Testing connection..." -ForegroundColor Yellow

$testResult = Test-NetConnection -ComputerName localhost -Port 3100 -WarningAction SilentlyContinue

if ($testResult.TcpTestSucceeded) {
    Write-Host "✅ Server is running successfully!" -ForegroundColor Green
    Write-Host "🌐 Open your browser and go to:" -ForegroundColor White
    Write-Host "   http://localhost:3100" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔐 Demo Login Accounts:" -ForegroundColor Yellow
    Write-Host "   • estimator@company.com / password123" -ForegroundColor White
    Write-Host "   • pm@company.com / password123" -ForegroundColor White
    Write-Host "   • viewer@company.com / password123" -ForegroundColor White
} else {
    Write-Host "❌ Server connection failed" -ForegroundColor Red
    Write-Host "🔍 Checking server output..." -ForegroundColor Yellow
    Receive-Job $job.Id
}

Write-Host ""
Write-Host "📊 Server Job ID: $($job.Id)" -ForegroundColor Blue
Write-Host "To stop server: Remove-Job -Id $($job.Id) -Force" -ForegroundColor Gray
