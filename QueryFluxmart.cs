using System;
using Npgsql;
using System.IO;

class Program {
    static void Main() {
        string connStr = "Host=fluxmart.cr129c0vrf59.sa-east-1.rds.amazonaws.com;Port=5432;Database=BDGerenciadorFluxmart;Username=fluxmart;Password=cflxarrobafmt;SSL Mode=Require;Trust Server Certificate=true";
        
        try {
            using (var conn = new NpgsqlConnection(connStr)) {
                conn.Open();
                Console.WriteLine("✓ Conexão ao BDGerenciadorFluxmart OK!");
                
                // Listar bancos cadastrados por CNPJ
                using (var cmd = new NpgsqlCommand(@"SELECT ""NomeBD"", ""IP_Servidor"", ""CNPJ"" FROM ""CatalogoBDsCNPJ"" LIMIT 50", conn))
                using (var reader = cmd.ExecuteReader()) {
                    Console.WriteLine("\n=== BANCOS CADASTRADOS ===");
                    while (reader.Read()) {
                        Console.WriteLine("BD: " + reader["NomeBD"] + " | IP: " + reader["IP_Servidor"] + " | CNPJ: " + reader["CNPJ"]);
                    }
                }
            }
        }
        catch (Exception ex) {
            Console.WriteLine("ERRO: " + ex.Message);
        }
    }
}
