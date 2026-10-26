# Publica o painel no GitHub Pages.
# Uso:  .\publicar.ps1                      (só envia o que já foi commitado)
#       .\publicar.ps1 "atualizei a semana"  (commita tudo com essa mensagem e envia)
param([string]$Mensagem)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

gh auth status *> $null
if ($LASTEXITCODE -ne 0) { Write-Host 'Faça login primeiro: gh auth login' -ForegroundColor Yellow; exit 1 }

git config user.name 'Pedro Braga de Lima'
git config user.email '186768306+Blima-P@users.noreply.github.com'

if ($Mensagem) {
  git add -A
  git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) { git commit -m $Mensagem }
}

git remote get-url origin *> $null
if ($LASTEXITCODE -ne 0) {
  gh repo create Blima-P/painel-semanal --public --description 'meu painel semanal de hábitos, metas e treinos 💪' --source . --push
  gh api -X POST repos/Blima-P/painel-semanal/pages -f 'source[branch]=main' -f 'source[path]=/' | Out-Null
} else {
  git push origin main
}
Write-Host 'Pronto! Em 1-2 minutos: https://blima-p.github.io/painel-semanal/' -ForegroundColor Green
