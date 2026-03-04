$files = Get-ChildItem "src/components/calculators/*.jsx"
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $old = "useLocalStorage('app_material_prices', getDefaultPrices())"
    $new = "useLocalStorage('app_material_prices', getDefaultPrices(), { mergeDefaults: true })"
    if ($content -match [regex]::Escape($old)) {
        $content = $content.Replace($old, $new)
        Set-Content $f.FullName $content -NoNewline
        Write-Host "Updated: $($f.Name)"
    }
}
