# Deploy Two-step e-commerce to Railway (requires RAILWAY_TOKEN or `railway login`)
# Usage:
#   $env:RAILWAY_TOKEN = "your-token-from-https://railway.com/account/tokens"
#   .\scripts\deploy-railway.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot

function Require-RailwayCli {
    if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
        npm install -g @railway/cli
    }
}

function Require-Auth {
    $whoami = railway whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Not logged in to Railway." -ForegroundColor Red
        Write-Host "Option A: Set a token (recommended for automation):" -ForegroundColor Yellow
        Write-Host '  $env:RAILWAY_TOKEN = "paste-token-from-https://railway.com/account/tokens"'
        Write-Host "Option B: Interactive login in your terminal:"
        Write-Host "  railway login"
        Write-Host ""
        exit 1
    }
    Write-Host "Railway account: $whoami" -ForegroundColor Green
}

function Get-JsonFromRailway {
    param([string[]]$Args)
    $raw = & railway @Args 2>&1
    if ($LASTEXITCODE -ne 0) { throw "railway $($Args -join ' ') failed: $raw" }
    return $raw | ConvertFrom-Json
}

function New-Secret {
    return node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))'
}

Require-RailwayCli
Require-Auth

$projectName = "twostep-ecommerce"
$linked = $false
try {
    $statusJson = railway status --json 2>$null | ConvertFrom-Json
    if ($statusJson.project) { $linked = $true }
} catch { }

if (-not $linked) {
    Write-Host "Linking to existing project 'TwoStep.com' (skip init if free plan limit reached)..." -ForegroundColor Cyan
    railway link -p "TwoStep.com" -e production -s "TwoStep.com" 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "CLI link failed (known VolumeInstance bug). Using project IDs in commands." -ForegroundColor Yellow
        $script:UseExplicitIds = $true
        $script:ProjectId = "3ed558be-d4b5-478e-b22d-0ac9bd36cbb6"
        $script:EnvironmentId = "ef9ad531-71e4-4918-8bfa-08bff91bd108"
        $script:WebServiceId = "5a8bc298-9f8e-4d22-b555-335d658d39ed"
        $script:PostgresServiceName = "Postgres"
    }
}

Write-Host "Adding PostgreSQL (if not present)..." -ForegroundColor Cyan
$servicesBefore = @(Get-JsonFromRailway @("service", "list", "--json"))
$hasPostgres = $servicesBefore | Where-Object { $_.name -match 'postgres' -or $_.name -eq 'Postgres' }
if (-not $hasPostgres) {
    railway add --database postgres --json | Out-Host
    Start-Sleep -Seconds 5
}

$services = @(Get-JsonFromRailway @("service", "list", "--json"))
$postgresService = ($services | Where-Object { $_.name -match 'postgres' } | Select-Object -First 1).name
if (-not $postgresService) { $postgresService = "Postgres" }

$webService = ($services | Where-Object { $_.name -notmatch 'postgres' } | Select-Object -First 1).name
if (-not $webService) {
    Write-Host "Creating web service..." -ForegroundColor Cyan
    railway add --service web --json | Out-Host
    $services = @(Get-JsonFromRailway @("service", "list", "--json"))
    $webService = ($services | Where-Object { $_.name -notmatch 'postgres' } | Select-Object -First 1).name
}

Write-Host "Linking web service: $webService" -ForegroundColor Cyan
railway service link $webService | Out-Host

Write-Host "Generating public domain..." -ForegroundColor Cyan
$domainJson = railway domain --service $webService --json 2>&1
$publicUrl = $null
try {
    $domainObj = $domainJson | ConvertFrom-Json
    $publicUrl = if ($domainObj.domain) { "https://$($domainObj.domain)" } else { $domainObj.url }
} catch {
    $domainLine = ($domainJson | Select-String -Pattern 'https?://[^\s]+' | Select-Object -First 1)
    if ($domainLine) { $publicUrl = $domainLine.Matches[0].Value }
}
if (-not $publicUrl) {
    $publicUrl = "https://[your-service].up.railway.app"
    Write-Host "Could not parse domain from CLI; set CLIENT_URL after deploy from Railway dashboard." -ForegroundColor Yellow
}

$jwtSecret = New-Secret
$jwtRefresh = New-Secret

Write-Host "Setting environment variables on '$webService'..." -ForegroundColor Cyan
$dbRef = '${{' + $postgresService + '.DATABASE_URL}}'
$vars = @(
    "NODE_ENV=production",
    "DATABASE_URL=$dbRef",
    "CLIENT_URL=$publicUrl",
    "JWT_SECRET=$jwtSecret",
    "JWT_REFRESH_SECRET=$jwtRefresh",
    "UPLOAD_DIR=./uploads/products"
)
foreach ($v in $vars) {
    railway variable set "$v" --service $webService --skip-deploys | Out-Host
}

Write-Host "Deploying application (this may take several minutes)..." -ForegroundColor Cyan
railway up --service $webService --detach --ci
if ($LASTEXITCODE -ne 0) { throw "railway up failed" }

Write-Host "Waiting for deployment to become active..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host "Initializing database (schema + seed)..." -ForegroundColor Cyan
$dbInitCmd = 'cd server && npm run int-db'
railway run --service $webService -- sh -c $dbInitCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "DB init failed - run manually after deploy:" -ForegroundColor Yellow
    Write-Host "  railway run --service $webService -- sh -c '$dbInitCmd'"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  App URL:     $publicUrl"
Write-Host "  Health:      $publicUrl/api/health"
Write-Host "  Admin login: admin@twostep.com / admin123"
Write-Host ""
Write-Host "  Save these secrets (shown once):" -ForegroundColor Yellow
Write-Host "  JWT_SECRET=$jwtSecret"
Write-Host "  JWT_REFRESH_SECRET=$jwtRefresh"
Write-Host ""
