# BidFlow Personal Edition - Server Management
param(
    [string]$Action = "status"
)

Write-Host "🏗️ BidFlow Personal Edition - Server Manager" -ForegroundColor Blue
Write-Host "=" * 50

switch ($Action.ToLower()) {
    "start" {
        Write-Host "🚀 Starting BidFlow server..." -ForegroundColor Green
        $job = Start-Job -ScriptBlock { 
            Set-Location $using:PWD
            npx next dev --port 3100 
        }
        Start-Sleep -Seconds 8
        Write-Host "📊 Job ID: $($job.Id)" -ForegroundColor Yellow
        Write-Host "🌐 Access: http://localhost:3100" -ForegroundColor Cyan
    }
    
    "stop" {
        Write-Host "🛑 Stopping BidFlow server..." -ForegroundColor Red
        Get-Job | Where-Object { $_.Command -like "*next dev*" } | Stop-Job
        Get-Job | Where-Object { $_.Command -like "*next dev*" } | Remove-Job -Force
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        Write-Host "✅ Server stopped" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "🔄 Restarting BidFlow server..." -ForegroundColor Yellow
        & $PSCommandPath -Action stop
        Start-Sleep -Seconds 2
        & $PSCommandPath -Action start
    }
    
    "status" {
        Write-Host "📊 Server Status:" -ForegroundColor Yellow
        $jobs = Get-Job | Where-Object { $_.Command -like "*next dev*" }
        
        if ($jobs) {
            Write-Host "✅ Server is running (Job ID: $($jobs.Id))" -ForegroundColor Green
            Write-Host "🌐 URL: http://localhost:3100" -ForegroundColor Cyan
            
            # Test connection
            $connection = Test-NetConnection -ComputerName localhost -Port 3100 -InformationLevel Quiet
            if ($connection) {
                Write-Host "✅ Server responding to requests" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Server running but not responding" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Server is not running" -ForegroundColor Red
            Write-Host "💡 Run: .\manage-server.ps1 -Action start" -ForegroundColor Gray
        }
    }
    
    "logs" {
        Write-Host "📋 Server Logs:" -ForegroundColor Yellow
        $jobs = Get-Job | Where-Object { $_.Command -like "*next dev*" }
        if ($jobs) {
            Receive-Job -Id $jobs.Id
        } else {
            Write-Host "❌ No server running" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "🔧 Available Commands:" -ForegroundColor Cyan
        Write-Host "  .\manage-server.ps1 -Action start   # Start server"
        Write-Host "  .\manage-server.ps1 -Action stop    # Stop server"
        Write-Host "  .\manage-server.ps1 -Action restart # Restart server"
        Write-Host "  .\manage-server.ps1 -Action status  # Check status"
        Write-Host "  .\manage-server.ps1 -Action logs    # View logs"
    }
}

Write-Host "`n🔐 Demo Accounts:" -ForegroundColor Yellow
Write-Host "  • estimator@company.com / password123 (Full Access)" -ForegroundColor White
Write-Host "  • pm@company.com / password123 (Management)" -ForegroundColor White
Write-Host "  • viewer@company.com / password123 (Read-only)" -ForegroundColor White
