# Copia el overlay de IPLANAY sobre un clone de mxsig_client.
# El cliente tiene que estar en proyectos\iplanay\geovisor.

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$overlay = Join-Path $root "proyectos\iplanay\geovisor-overlay"
$dest = Join-Path $root "proyectos\iplanay\geovisor"

if (-not (Test-Path (Join-Path $dest ".git"))) {
    throw "No hay un clone de mxsig_client en $dest. Ejecuta scripts\clonar-dependencias.ps1"
}

$copied = 0
Get-ChildItem -LiteralPath $overlay -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($overlay.Length).TrimStart("\")
    if ($rel -eq "README.md") {
        return
    }
    $target = Join-Path $dest $rel
    $parent = Split-Path $target -Parent
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    Copy-Item -LiteralPath $_.FullName -Destination $target -Force
    $script:copied++
}

Write-Host "Overlay aplicado: $copied archivos en $dest"
