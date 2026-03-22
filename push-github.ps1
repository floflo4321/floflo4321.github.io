# Usage (dans PowerShell, depuis ce dossier) :
#   .\push-github.ps1 -RemoteUrl "https://github.com/VOTRE_PSEUDO/VOTRE_DEPOT.git"
#
# Au mot de passe GitHub : colle un Personal Access Token (pas le mot de passe du site).
# Création du token : https://github.com/settings/tokens → Generate new token (classic) → cocher "repo"

param(
    [Parameter(Mandatory = $true)]
    [string]$RemoteUrl
)

$git = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $git)) { $git = "git" }

Set-Location $PSScriptRoot

$null = & $git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Mise a jour de origin -> $RemoteUrl"
    & $git remote set-url origin $RemoteUrl
} else {
    Write-Host "Ajout de origin -> $RemoteUrl"
    & $git remote add origin $RemoteUrl
}

Write-Host "Envoi de la branche main..."
& $git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Si erreur d'authentification : cree un token sur github.com/settings/tokens (droits 'repo') et utilise-le comme mot de passe."
}
