param([string]$End = '2026-10-01')
$ErrorActionPreference = 'Stop'
$folder = Join-Path $PSScriptRoot data
foreach ($series in @('FEDFUNDS','EXKOUS','POILBREUSDM')) {
    $uri = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=$series&cosd=2007-01-01&coed=$End"
    $response = Invoke-WebRequest -Uri $uri
    $raw = $response.Content
    if ($raw -is [byte[]]) { $raw = [Text.Encoding]::UTF8.GetString($raw) }
    $rows = @($raw | ConvertFrom-Csv)
    if ($rows.Count -eq 0 -or $series -notin $rows[0].PSObject.Properties.Name) {
        throw "Unexpected FRED response for $series"
    }
    $previous = ''
    $valid = @(foreach ($row in $rows) {
        $date = $row.observation_date
        if ($date -notmatch '^\d{4}-\d{2}-\d{2}$' -or $date -le $previous) { throw "Invalid date sequence for $series" }
        $previous = $date
        if ($row.$series -in @('', '.')) { continue }
        if ($row.$series -notmatch '^-?\d+(\.\d+)?$') { throw "Invalid value for $series on $date" }
        $row
    })
    if ($valid.Count -eq 0) { throw "No observations for $series" }
    Set-Content -LiteralPath (Join-Path $folder "$series.csv") -Encoding utf8 -Value $raw
    [pscustomobject]@{ Series=$series; First=$valid[0].observation_date; Last=$valid[-1].observation_date; Observations=$valid.Count; Missing=($rows.Count-$valid.Count); Source=$uri }
}

