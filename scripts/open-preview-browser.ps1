param(
  [Parameter(Mandatory = $true)]
  [string]$PreviewUrl,

  [string]$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe",

  [string]$ProfileDir = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ChromePath)) {
  throw "Chrome was not found at: $ChromePath"
}

$args = @(
  "--disable-web-security"
  "--allow-running-insecure-content"
  "--disable-features=BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,PrivateNetworkAccessPermissionPrompt"
  "--unsafely-treat-insecure-origin-as-secure=http://localhost:8000,http://localhost:8001"
  "--disable-site-isolation-trials"
)

if (-not [string]::IsNullOrWhiteSpace($ProfileDir)) {
  New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null
  $args += "--user-data-dir=$ProfileDir"
}

$args += $PreviewUrl

Start-Process -FilePath $ChromePath -ArgumentList $args | Out-Null
Write-Host "Opened preview URL in Chrome with Sadady preview compatibility flags."
