# Start BidFlow Server and Test Connection
Write-Host "🚀 Starting BidFlow Development Server..." -ForegroundColor Green

# Kill any existing processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "📦 Starting Next.js server on port 3100..." -ForegroundColor Yellow

# Start the server in background
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npx next dev --port 3100
}

# Wait a moment for server to start
Start-Sleep -Seconds 10

Write-Host "🔍 Testing server connection..." -ForegroundColor Cyan

# Test the connection
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3100" -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Server is responding! Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "🌐 Open your browser to: http://localhost:3100" -ForegroundColor White
    
    # Show server job info
    Write-Host "📊 Server Job Status:" -ForegroundColor Yellow
    Get-Job $job.Id | Format-Table
    
} 
catch {
    Write-Host "❌ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
    
    # Show job output for debugging
    Write-Host "🔍 Server Output:" -ForegroundColor Yellow
    Receive-Job $job.Id
}

# Keep the job running
Write-Host "Server job ID: $($job.Id)" -ForegroundColor Blue
Write-Host "To stop: Remove-Job -Id $($job.Id) -Force" -ForegroundColor Gray

# Test with different addresses
Write-Host "`n🔗 Try these URLs in your browser:" -ForegroundColor Cyan
Write-Host "  • http://localhost:3100" -ForegroundColor White
Write-Host "  • http://127.0.0.1:3100" -ForegroundColor White

Write-Host "`n🔐 Demo Accounts:" -ForegroundColor Yellow
Write-Host "  • estimator@company.com / password123" -ForegroundColor White
Write-Host "  • pm@company.com / password123" -ForegroundColor White  
Write-Host "  • viewer@company.com / password123" -ForegroundColor White
