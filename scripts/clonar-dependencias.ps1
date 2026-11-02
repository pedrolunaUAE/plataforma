# Clona OVIE, MxSIG y el cliente del geovisor si esas carpetas aun no existen.
# No modifica un clone que ya este en disco.
# Si el geovisor se clona en esta ejecucion, aplica el overlay de IPLANAY.

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$revisionGeovisor = "e0c22b375eb93e3e551c4a2e2a810fe4d7c99f4d"

function Clone-IfMissing {
    param(
        [string]$Url,
        [string]$Dest,
        [string]$Revision
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
    if ($Revision) {
        git -C $Dest checkout $Revision
        if ($LASTEXITCODE -ne 0) {
            throw "git checkout fallo: $Revision"
        }
    }
    return $true
}

$nuevoGeovisor = Clone-IfMissing `
    -Url "https://git.inegi.org.mx/mxsig/mxsig_client.git" `
    -Dest (Join-Path $root "proyectos\iplanay\geovisor") `
    -Revision $revisionGeovisor

Clone-IfMissing `
    -Url "https://github.com/pedrolunaUAE/OVIE.git" `
    -Dest (Join-Path $root "proyectos\ovie") | Out-Null

Clone-IfMissing `
    -Url "https://git.inegi.org.mx/mxsig/mxsig.git" `
    -Dest (Join-Path $root "proyectos\mxsig") | Out-Null

if ($nuevoGeovisor) {
    & (Join-Path $PSScriptRoot "aplicar-overlay-geovisor.ps1")
}

Write-Host "Listo."
