# run-local.ps1
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot"
$env:MAVEN_HOME = "C:\ProgramData\chocolatey\lib\maven\apache-maven-3.9.12"
$env:PATH = "$env:MAVEN_HOME\bin;$env:PATH"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COQUI BOT - Local Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1. Building frontend..." -ForegroundColor Cyan
Set-Location src/main/frontend
npm run build
Set-Location ../../../

Write-Host "`n2. Building backend..." -ForegroundColor Cyan
if (Test-Path "target/MyTodoList-0.0.1-SNAPSHOT.jar") {
    Write-Host "   JAR already exists, skipping build" -ForegroundColor Green
} else {
    Write-Host "   Compiling..." -ForegroundColor Yellow
    & mvn package -DskipTests
}

Write-Host "`n3. Starting application..." -ForegroundColor Cyan
Write-Host "   URL: http://localhost:8080" -ForegroundColor Green
Write-Host "   Profile: local" -ForegroundColor Green

$walletPath = "$(Get-Location)\wallet"
$jarPath = "target/MyTodoList-0.0.1-SNAPSHOT.jar"

& java @("-Doracle.net.tns_admin=$walletPath", "-jar", $jarPath, "--spring.profiles.active=local")