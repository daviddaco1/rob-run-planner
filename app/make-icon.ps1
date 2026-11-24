# Genera app\icon.ico (PNG 16-256 px) dibujado con System.Drawing. Uso: pwsh app\make-icon.ps1
Add-Type -AssemblyName System.Drawing
$sizes = 16, 24, 32, 48, 64, 128, 256
$pngs = foreach ($n in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $n, $n
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
    $k = $n / 256
    # fondo: cuadrado redondeado oscuro con borde dorado
    $r = [int](56 * $k); $m = [Math]::Max(1, [int](8 * $k)); $w = $n - 2 * $m
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($m, $m, $r, $r, 180, 90); $path.AddArc($m + $w - $r, $m, $r, $r, 270, 90)
    $path.AddArc($m + $w - $r, $m + $w - $r, $r, $r, 0, 90); $path.AddArc($m, $m + $w - $r, $r, $r, 90, 90); $path.CloseFigure()
    $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(24, 26, 32))), $path)
    $g.DrawPath((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(242, 180, 65)), ([Math]::Max(1, 10 * $k))), $path)
    # hoja verde (planta) arriba a la derecha
    $g.TranslateTransform(168 * $k, 84 * $k); $g.RotateTransform(-40)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(88, 196, 98))), -22 * $k, -46 * $k, 44 * $k, 92 * $k)
    $g.DrawLine((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(24, 26, 32)), ([Math]::Max(1, 5 * $k))), 0, -40 * $k, 0, 40 * $k)
    $g.ResetTransform()
    # "RR" dorado
    $font = New-Object System.Drawing.Font 'Segoe UI Black', (118 * $k), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $fmt = New-Object System.Drawing.StringFormat; $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
    $g.DrawString('RR', $font, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(242, 180, 65))), (New-Object System.Drawing.RectangleF 0, (40 * $k), $n, ($n - 40 * $k)), $fmt)
    $ms = New-Object System.IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    if ($n -eq 256) { $bmp.Save("$PSScriptRoot\icon-256.png") }
    , $ms.ToArray()
}
# ICO: cabecera + directorio + PNGs
$out = New-Object System.IO.MemoryStream; $bw = New-Object System.IO.BinaryWriter $out
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$sizes.Count)
$off = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i] % 256
    $bw.Write([byte]$s); $bw.Write([byte]$s); $bw.Write([byte]0); $bw.Write([byte]0)
    $bw.Write([uint16]1); $bw.Write([uint16]32); $bw.Write([uint32]$pngs[$i].Length); $bw.Write([uint32]$off)
    $off += $pngs[$i].Length
}
foreach ($p in $pngs) { $bw.Write($p) }
[System.IO.File]::WriteAllBytes("$PSScriptRoot\icon.ico", $out.ToArray())
"$PSScriptRoot\icon.ico"
