const fs = require('fs');
const path = require('path');

const srcApp = path.join(__dirname, 'src', 'app');
const adminDir = path.join(srcApp, '(admin)');

const moves = [
  // Layout and top-level pages
  { from: path.join(srcApp, 'dashboard', 'layout.tsx'), to: path.join(adminDir, 'layout.tsx') },
  { from: path.join(srcApp, 'dashboard', 'page.tsx'), to: path.join(adminDir, 'dashboard', 'page.tsx') },

  // Vendas e Clientes
  { from: path.join(srcApp, 'dashboard', 'cadastros', 'clientes'), to: path.join(adminDir, 'vendas-clientes', 'clientes') },
  { from: path.join(srcApp, 'dashboard', 'cadastros', 'vendedores'), to: path.join(adminDir, 'vendas-clientes', 'vendedores') },
  { from: path.join(srcApp, 'dashboard', 'cadastros', 'origens-de-venda'), to: path.join(adminDir, 'vendas-clientes', 'origens-de-venda') },

  // Estoque e Produtos
  { from: path.join(srcApp, 'dashboard', 'cadastros', 'produtos-servicos'), to: path.join(adminDir, 'estoque-produtos', 'produtos-servicos') },
  { from: path.join(srcApp, 'dashboard', 'cadastros', 'categorias-de-insumo'), to: path.join(adminDir, 'estoque-produtos', 'categorias-de-insumo') },
  { from: path.join(srcApp, 'dashboard', 'cadastros', 'insumos'), to: path.join(adminDir, 'estoque-produtos', 'insumos') },
];

// Replaces string mapping
const replaces = [
  { from: '/dashboard/cadastros/clientes', to: '/vendas-clientes/clientes' },
  { from: '/dashboard/cadastros/vendedores', to: '/vendas-clientes/vendedores' },
  { from: '/dashboard/cadastros/origens-de-venda', to: '/vendas-clientes/origens-de-venda' },
  { from: '/dashboard/cadastros/produtos-servicos', to: '/estoque-produtos/produtos-servicos' },
  { from: '/dashboard/cadastros/categorias-de-insumo', to: '/estoque-produtos/categorias-de-insumo' },
  { from: '/dashboard/cadastros/insumos', to: '/estoque-produtos/insumos' },
];

function moveFiles() {
  for (const move of moves) {
    if (fs.existsSync(move.from)) {
      const targetDir = path.dirname(move.to);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.cpSync(move.from, move.to, { recursive: true });
      fs.rmSync(move.from, { recursive: true, force: true });
      console.log(`Moved ${move.from} -> ${move.to}`);
    } else {
      console.log(`Not found: ${move.from}`);
    }
  }
}

function processFilesDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processFilesDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const rep of replaces) {
        if (content.includes(rep.from)) {
          // Replace globally using split and join to cover all variations
          content = content.split(rep.from).join(rep.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated paths in ${fullPath}`);
      }
    }
  }
}

console.log("Starting script...");
moveFiles();
processFilesDir(path.join(__dirname, 'src'));
console.log("Done.");
