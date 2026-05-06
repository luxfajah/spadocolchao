Add-Type -Path "C:\Program Files (x86)\Fluxmart\System.Threading.Tasks.Extensions.dll"
Add-Type -Path "C:\Program Files (x86)\Fluxmart\System.Memory.dll"
Add-Type -Path "C:\Program Files (x86)\Fluxmart\System.Buffers.dll"
Add-Type -Path "C:\Program Files (x86)\Fluxmart\System.Runtime.CompilerServices.Unsafe.dll"
Add-Type -Path "C:\Program Files (x86)\Fluxmart\Npgsql.dll"

$connStr = "Host=fluxmart.cr129c0vrf59.sa-east-1.rds.amazonaws.com;Port=5432;Database=BDGerenciadorFluxmart;Username=fluxmart;Password=cflxarrobafmt;SSL Mode=Require;Trust Server Certificate=true"
$conn = New-Object Npgsql.NpgsqlConnection($connStr)

try {
    $conn.Open()
    Write-Host "Conexao ao BDGerenciadorFluxmart OK!" -ForegroundColor Green
    
    # Listar bancos cadastrados por CNPJ
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT "NomeBD", "IP_Servidor", "CNPJ" FROM "CatalogoBDsCNPJ" LIMIT 30'
    $reader = $cmd.ExecuteReader()
    Write-Host "`n=== BANCOS CADASTRADOS ===" -ForegroundColor Cyan
    while ($reader.Read()) {
        Write-Host "BD: $($reader['NomeBD']) | IP: $($reader['IP_Servidor']) | CNPJ: $($reader['CNPJ'])"
    }
    $reader.Close()
    $conn.Close()
}
catch {
    Write-Host "ERRO no BDGerenciadorFluxmart: $_" -ForegroundColor Red
}

# Agora tenta conectar direto no banco da empresa (sera necessario saber o NomeBD)
# Se o NomeBD foi encontrado acima, substitua "SEU_BANCO_AQUI" pelo nome real
$nomeBD = "SEU_BANCO_AQUI"

if ($nomeBD -ne "SEU_BANCO_AQUI") {
    $connStr2 = "Host=fluxmart.cr129c0vrf59.sa-east-1.rds.amazonaws.com;Port=5432;Database=$nomeBD;Username=fluxmart;Password=cflxarrobafmt;SSL Mode=Require;Trust Server Certificate=true"
    $conn2 = New-Object Npgsql.NpgsqlConnection($connStr2)
    try {
        $conn2.Open()
        Write-Host "`nConexao ao banco $nomeBD OK!" -ForegroundColor Green
        
        $cmd2 = $conn2.CreateCommand()
        $cmd2.CommandText = 'SELECT table_name FROM information_schema.tables WHERE table_schema = ''public'' AND table_name ILIKE ''%func%'' OR table_name ILIKE ''%emplo%'' OR table_name ILIKE ''%trabalhador%'' ORDER BY table_name'
        $reader2 = $cmd2.ExecuteReader()
        Write-Host "`n=== TABELAS DE FUNCIONARIOS ===" -ForegroundColor Cyan
        while ($reader2.Read()) { Write-Host $reader2[0] }
        $reader2.Close()
        $conn2.Close()
    }
    catch {
        Write-Host "ERRO no banco $nomeBD : $_" -ForegroundColor Red
    }
}
