# Publica una versión: compila el .exe, empaqueta RobRunPlanner.zip y crea la release en GitHub.
# Uso (desde la raíz del repo):  .\tools\release.ps1
# La versión sale de APP_VERSION en core.js; la app instalada se actualiza si la etiqueta es más nueva.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$ver = [regex]::Match((Get-Content core.js -Raw), "APP_VERSION = '([\d.]+)'").Groups[1].Value
if (-not $ver) { throw 'No encuentro APP_VERSION en core.js' }
$tag = "v$ver"

npm test; if ($LASTEXITCODE) { throw 'Fallan las pruebas' }
node tools/gen-rutas.js

dotnet publish app -c Release -o app\out; if ($LASTEXITCODE) { throw 'Falló la compilación' }

$stage = Join-Path $root 'release\RobRunPlanner'
Remove-Item (Join-Path $root 'release') -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$stage\rutas", "$stage\schema" | Out-Null
Copy-Item app\out\RobRunPlanner.exe, ruta-escalado.html, catalogo.js, core.js, rutas-incluidas.js, README.md, COMO-CREAR-RUTAS.md, DATOS.md, CHANGELOG.md $stage
Copy-Item ruta-*.json "$stage\rutas"
Copy-Item schema\ruta.schema.json "$stage\schema"
try { Copy-Item app\out\RobRunPlanner.exe $root -Force } catch { Write-Warning 'No se pudo copiar el .exe a la raíz (¿está abierto?)' }  # .exe local para pruebas, ignorado por git
Remove-Item app\out -Recurse -Force
$zip = Join-Path $root 'release\RobRunPlanner.zip'
Compress-Archive -Path "$stage\*" -DestinationPath $zip

gh release create $tag $zip --title "Rob Run Planner $tag" --notes "Novedades en CHANGELOG.md. Descarga RobRunPlanner.zip, descomprímelo y abre RobRunPlanner.exe. Si ya lo tienes, la app te avisa y se actualiza sola (tus datos no se tocan)."
if ($LASTEXITCODE) { throw 'Falló gh release create' }
Write-Host "Publicada $tag"
