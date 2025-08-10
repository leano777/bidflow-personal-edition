# BidFlow Personal Edition - Development Server Startup Script
# This script starts the Next.js development server for the BidFlow application

Write-Host "🚀 Starting BidFlow Personal Edition Development Server..." -ForegroundColor Green
Write-Host "📁 Working Directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host "🌐 Server will be available at: http://localhost:3100" -ForegroundColor Cyan
Write-Host ""

# Start the Next.js development server
npx next dev --port 3100

Write-Host ""
Write-Host "✅ Server started successfully!" -ForegroundColor Green
Write-Host "🔗 Open your browser and navigate to: http://localhost:3100" -ForegroundColor White
Write-Host ""
Write-Host "Demo Login Accounts:" -ForegroundColor Yellow
Write-Host "  • Estimator: estimator@company.com / password123" -ForegroundColor White  
Write-Host "  • Project Manager: pm@company.com / password123" -ForegroundColor White
Write-Host "  • Viewer: viewer@company.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
