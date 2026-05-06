$root = Get-Item "."
$npgsql = Join-Path $root.FullName "Npgsql.dll"
$tasks = Join-Path $root.FullName "System.Threading.Tasks.Extensions.dll"
$unsafe = Join-Path $root.FullName "System.Runtime.CompilerServices.Unsafe.dll"
$memory = Join-Path $root.FullName "System.Memory.dll"
$buffers = Join-Path $root.FullName "System.Buffers.dll"

Add-Type -Path $npgsql
Add-Type -Path $tasks
Add-Type -Path $unsafe
Add-Type -Path $memory
Add-Type -Path $buffers

$connStr = "Host=aws-1-us-west-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.tqstaitdzyfyjjdrpven;Password=L3FNzJyWUfh#.E!;SSL Mode=Require;Trust Server Certificate=true"
$conn = New-Object Npgsql.NpgsqlConnection($connStr)

try {
    $conn.Open()
    Write-Host "--- Usuários do Sistema (Public User) ---" -ForegroundColor Cyan
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT name, username, email, "passwordHash", status FROM "User"'
    $reader = $cmd.ExecuteReader()
    while ($reader.Read()) {
        Write-Host "Nome: $($reader['name']) | User: $($reader['username']) | Email: $($reader['email']) | Status: $($reader['status'])"
        Write-Host "Hash: $($reader['passwordHash'])"
        Write-Host "----------------------------------"
    }
    $reader.Close()

    Write-Host "`n--- Usuários do Supabase Auth ---" -ForegroundColor Cyan
    $cmd.CommandText = 'SELECT email, encrypted_password FROM auth.users'
    try {
        $reader = $cmd.ExecuteReader()
        while ($reader.Read()) {
            Write-Host "Email: $($reader['email']) | Hash: $($reader['encrypted_password'])"
        }
        $reader.Close()
    } catch {
        Write-Host "Não foi possível acessar auth.users"
    }

    $conn.Close()
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
}
