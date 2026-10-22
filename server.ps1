# Robust Local Network Server for Mobile Browser Access using TcpListener (No Admin required!)
$port = 8080
$folder = $PSScriptRoot

$ip = "192.168.1.6"
try {
    $foundIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match 'Wi-Fi' -or $_.InterfaceAlias -match 'Wireless' } | Select-Object -First 1).IPAddress
    if ($foundIp) { $ip = $foundIp }
} catch {}

$endpoint = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, $port)
$tcpListener = New-Object System.Net.Sockets.TcpListener($endpoint)

try {
    $tcpListener.Start()
} catch {
    Write-Host "Could not start server on port $port: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   LENSKART EXECUTIVE CX DASHBOARD - MOBILE ACCESS" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " 1. Make sure your phone is connected to the same Wi-Fi." -ForegroundColor White
Write-Host " 2. Open Chrome or Safari on your phone and go to:" -ForegroundColor Yellow
Write-Host ""
Write-Host "    http://${ip}:${port}    " -ForegroundColor White -BackgroundColor DarkGreen
Write-Host ""
Write-Host " On this PC, you can open: http://localhost:$port" -ForegroundColor Gray
Write-Host " To stop this server, close this window or press Ctrl+C." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Server is running... waiting for phone requests..." -ForegroundColor DarkGray

while ($true) {
    try {
        $client = $tcpListener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $writer = New-Object System.IO.StreamWriter($stream)

        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        # Parse request line: GET /path HTTP/1.1
        $parts = $requestLine.Split(" ")
        $method = $parts[0]
        $rawPath = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
        $cleanPath = $rawPath.Split("?")[0]

        if ($cleanPath -eq "/" -or $cleanPath -eq "") {
            $cleanPath = "/index.html"
        }

        $localPath = Join-Path $folder ($cleanPath.TrimStart("/").Replace("/", "\"))

        if (Test-Path $localPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()

            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }

            $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)

            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
            $stream.Flush()
        } else {
            $notFound = "HTTP/1.1 404 Not Found`r`nContent-Length: 13`r`nConnection: close`r`n`r`n404 Not Found"
            $nfBytes = [System.Text.Encoding]::ASCII.GetBytes($notFound)
            $stream.Write($nfBytes, 0, $nfBytes.Length)
            $stream.Flush()
        }

        $client.Close()
    } catch {
        # continue loop
    }
}
