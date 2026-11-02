# Clona OVIE, IPLANAY y MxSIG si esas carpetas aun no existen.
# No modifica un clone que ya este en disco.
# IPLANAY, al clonarse, trae tambien el cliente del geovisor.

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Clone-IfMissing {
    param(
        [string]$Url,
        [string]$Dest
    )
    if (Test-Path (Join-Path $Dest ".git")) {
        Write-Host "Ya existe, no se toca: $Dest"
        return $false
    }
    if (Test-Path $Dest) {
        Write-Host "La carpeta existe y no es un clone. No se toca: $Dest"
        return $false
    }
    $parent = Split-Path $Dest -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    Write-Host "Clonando $Url"
    git clone $Url $Dest
    if ($LASTEXITCODE -ne 0) {
        throw "git clone fallo: $Url"
    }
    return $true
}

$iplanay = Join-Path $root "proyectos\iplanay"
$nuevoIplanay = Clone-IfMissing -Url "https://github.com/pedrolunaUAE/iplanay.git" -Dest $iplanay

Clone-IfMissing -Url "https://github.com/pedrolunaUAE/OVIE.git" -Dest (Join-Path $root "proyectos\ovie") | Out-Null
Clone-IfMissing -Url "https://git.inegi.org.mx/mxsig/mxsig.git" -Dest (Join-Path $root "proyectos\mxsig") | Out-Null

$cliente = Join-Path $iplanay "scripts\clonar-cliente.ps1"
if (Test-Path $cliente) {
    & $cliente
} elseif ($nuevoIplanay) {
    throw "El repo de IPLANAY no trajo scripts\clonar-cliente.ps1"
}

Write-Host "Listo."
