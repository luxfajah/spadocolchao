const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'app', '(admin)');

const routes = [
  'pdv',
  'vendas-clientes/vendas',
  'vendas-clientes/pedidos',
  'vendas-clientes/kanban',
  'vendas-clientes/comissoes',
  'vendas-clientes/metas',
  'estoque-produtos/ficha-tecnica',
  'estoque-produtos/movimentacoes',
  'estoque-produtos/compras',
  'estoque-produtos/fornecedores',
  'financeiro/contas-a-pagar',
  'financeiro/contas-a-receber',
  'financeiro/fluxo-de-caixa',
  'financeiro/fechamento-de-caixa',
  'financeiro/categorias-financeiras',
  'financeiro/centros-de-custo',
  'financeiro/formas-de-pagamento',
  'rh/funcionarios',
  'rh/cargos',
  'rh/jornadas',
  'rh/ponto',
  'rh/tratativa-de-ponto',
  'rh/folha',
  'rh/holerites',
  'configuracoes/usuarios',
  'configuracoes/permissoes',
  'configuracoes/regras-de-comissao',
  'configuracoes/parametros',
  'configuracoes/empresa',
  'configuracoes/backup',
  'configuracoes/auditoria'
];

function titleCase(str) {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

for (const route of routes) {
  const dirPath = path.join(adminDir, route);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const filePath = path.join(dirPath, 'page.tsx');
  if (!fs.existsSync(filePath)) {
    const title = titleCase(path.basename(route));
    const content = `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ${title.replace(/\s+/g, '')}Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">${title}</h1>
        <p className="text-muted-foreground">Esta página ainda está em construção.</p>
      </div>

      <Card className="border-brand-900/20 bg-brand-900/5">
        <CardHeader>
          <CardTitle>Módulo em desenvolvimento</CardTitle>
          <CardDescription>
            Funcionalidades para ${title} estarão disponíveis em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-brand-900/20 rounded-xl">
            <p>Placeholder para a página de ${title}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
`;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Created placeholder for ${route}`);
  }
}
