$html = [System.IO.File]::ReadAllText("$PSScriptRoot\index.html", [System.Text.Encoding]::UTF8)
$css = [System.IO.File]::ReadAllText("$PSScriptRoot\styles.css", [System.Text.Encoding]::UTF8)
$js = [System.IO.File]::ReadAllText("$PSScriptRoot\app.js", [System.Text.Encoding]::UTF8)

$html = $html.Replace('<link rel="stylesheet" href="styles.css">', "<style>`r`n$css`r`n</style>")
$html = $html.Replace('<script src="app.js"></script>', "<script>`r`n$js`r`n</script>")

[System.IO.File]::WriteAllText("$PSScriptRoot\lenskart_mobile.html", $html, [System.Text.Encoding]::UTF8)
Write-Host "Successfully generated standalone lenskart_mobile.html"
