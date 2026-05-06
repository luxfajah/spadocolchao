import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados PostgreSQL (Supabase)');

    // 1. Usuários da tabela pública
    const publicUsers = await client.query('SELECT id, name, username, email, "passwordHash", status FROM "User"');
    console.log('\n--- Usuários do Sistema (Tabela Pública) ---');
    console.table(publicUsers.rows.map(u => ({
      Nome: u.name,
      Username: u.username,
      Email: u.email,
      Hash: u.passwordHash?.substring(0, 20) + '...',
      Status: u.status
    })));

    // 2. Usuários do Supabase Auth (se houver)
    try {
      const authUsers = await client.query('SELECT id, email, encrypted_password, created_at FROM auth.users');
      console.log('\n--- Usuários do Supabase Auth ---');
      console.table(authUsers.rows.map(u => ({
        ID: u.id,
        Email: u.email,
        'Hash Senha': u.encrypted_password?.substring(0, 20) + '...',
        Criado: u.created_at
      })));
    } catch (e) {
      console.log('\n(Nota: Não foi possível acessar auth.users ou a tabela está vazia)');
    }

  } catch (err) {
    console.error('Erro ao conectar ou consultar:', err);
  } finally {
    await client.end();
  }
}

main();
