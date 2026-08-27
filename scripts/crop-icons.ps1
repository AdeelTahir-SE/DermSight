Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile("e:\codingfolder\DermSight\Dermsight\assets\splash\splash-icons.png")
$w = $src.Width
$h = $src.Height
Write-Host "Source image: ${w}x${h}"

$cellW = [math]::Floor($w / 3)
$cellH = [math]::Floor($h / 2)

# Icon definitions: name, col (0-2), row (0-1)
$icons = @(
    @{ Name="ai-chip";      Col=0; Row=0 },
    @{ Name="offline-cloud"; Col=1; Row=0 },
    @{ Name="upload-cloud";  Col=2; Row=0 },
    @{ Name="camera";        Col=0; Row=1 },
    @{ Name="image";         Col=1; Row=1 },
    @{ Name="location-pin";  Col=2; Row=1 }
)

$outDir = "e:\codingfolder\DermSight\Dermsight\assets\icons"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

foreach ($icon in $icons) {
    $x = $icon.Col * $cellW
    $y = $icon.Row * $cellH
    $cropRect = New-Object System.Drawing.Rectangle($x, $y, $cellW, $cellH)
    $bmp = New-Object System.Drawing.Bitmap($cellW, $cellH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $outPath = Join-Path $outDir "$($icon.Name).png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $outPath (${cellW}x${cellH})"
}

$src.Dispose()
Write-Host "Done - extracted $($icons.Count) icons"
