$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$modelDir = Join-Path $root '_src\models'
New-Item -ItemType Directory -Force $modelDir | Out-Null
$models = @(
  'Sofa_01','modern_arm_chair_01','CoffeeTable_01','dining_table','dining_chair_02',
  'potted_plant_01','pachira_aquatica_01','modern_ceiling_lamp_01','throw_pillows_01',
  'bull_head','planter_box_01','outdoor_table_chair_set_01','ornate_mirror_01','stone_fire_pit'
)
foreach ($name in $models) {
  $dest = Join-Path $modelDir $name
  New-Item -ItemType Directory -Force $dest | Out-Null
  New-Item -ItemType Directory -Force (Join-Path $dest 'textures') | Out-Null
  $jsonPath = Join-Path $dest "$name.json"
  if (-not (Test-Path $jsonPath)) {
    curl.exe -s -m 90 "https://api.polyhaven.com/files/$name" -o $jsonPath
  }
  $j = Get-Content $jsonPath -Raw | ConvertFrom-Json
  $gltf = $j.gltf.'1k'.gltf
  $gltfPath = Join-Path $dest "$name.gltf"
  curl.exe -L -s -m 180 $gltf.url -o $gltfPath
  foreach ($prop in $gltf.include.PSObject.Properties) {
    $rel = $prop.Name
    $url = $prop.Value.url
    $out = Join-Path $dest ($rel -replace '/', '\')
    New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
    if (-not (Test-Path $out)) { curl.exe -L -s -m 240 $url -o $out }
  }
  Write-Output "done $name"
}

# textures
$texDir = Join-Path $root '_src\tex'
foreach ($name in @('marble_01','white_plaster_rough_02','mocha_oak_veneer','wool_boucle','rough_linen','concrete_floor_03','terrazzo_tiles')) {
  $jsonPath = Join-Path $texDir "$name.json"
  if (-not (Test-Path $jsonPath)) { curl.exe -s -m 90 "https://api.polyhaven.com/files/$name" -o $jsonPath }
  $j = Get-Content $jsonPath -Raw | ConvertFrom-Json
  foreach ($kind in @('Diffuse','Rough','nor_gl')) {
    $node = $j.$kind
    if ($null -eq $node) { continue }
    $url = $node.'2k'.jpg.url
    if (-not $url) { $url = $node.'2k'.png.url }
    if (-not $url) { $url = $node.'2k'.exr.url }
    if ($url) {
      $ext = [System.IO.Path]::GetExtension($url)
      $out = Join-Path $texDir "$name`_$kind`_2k$ext"
      if (-not (Test-Path $out)) { curl.exe -L -s -m 300 $url -o $out }
    }
  }
  Write-Output "texture $name"
}
Write-Output 'ALL DONE'
