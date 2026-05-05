# Arquitetura e Regras de Negócio - Spa do Colchão ERP

## Resumo Arquitetural
Este sistema foi desenhado para rodar localmente e de forma isolada (`local-first`), focado em operação diária fluida, não dependendo de conexão externa obrigatória (Cloud).

- **Framework principal**: Next.js 14.x (App Router)
- **UI**: Tailwind CSS + ShadcnUI (Radix primitives)
- **ORM & Banco Local**: Prisma + SQLite (`dev.db` guardado na máquina)
- **Layout**: Dashboard-centric architecture

## Regras Implementadas na Modelagem
O `schema.prisma` foi preparado com as 11 camadas exigidas:
1. **Sistema Básico**: Usuários, Níveis, Auditoria e Logs de App.
2. **Cadastro Mestre**: Clientes, Fornecedores, Vendedores e Origem da Venda (`LeadSource`).
3. **Comercial**: Vendas integradas para comissão baseada na origem e pedidos linkados ao kanban.
4. **Estoque e Produção**: A ficha técnica (`ProductRecipe`) dita as listagens que descontam automaticamente os insumos (`SupplyItem`) nos eventos de movimento (`StockMovement`).
5. **Compras**: Integrado com contas a pagar via fornecedores.
6. **Financeiro**: Módulo completo com Caixa Diário e relatórios agrupados.

## Regras de Negócio (Checklist Base)
- [ ] O **Status do Pedido** ("Entregue") não interfere automaticamente em "Pago" a fim de prever inadimplência.
- [ ] Valores de estoque são baseados na menor unidade (ml, cm, gramas, etc.), descontados via *recipes*.
- [ ] Usuários que fizerem lançamentos manuais acionam a tabela `AuditLog`.
- [ ] Vendedores têm link com regras flexíveis (`CommissionRule`), baseadas ou na Origem do Lide, ou no Produto de fato.

## Como Executar Este Projeto no Windows

Através da leitura dos logs deste terminal, identifiquei que o comando `node` e `npm` não estão disponíveis diretamente. O NodeJS é **obrigatório** para processar o React e o Next.js localmente. 

### 1. Instalação de Requisitos (Se necessário)
Baixe o [Node.js (versão LTS)](https://nodejs.org/) e o instale no Windows. Certifique-se de marcar a opção "Add to PATH" durante a instalação.

### 2. Fluxo Inicial
Abra o seu PowerShell ou CMD *como administrador* (caso o Node tenha sido instalado há pouco, reinicie o PowerShell) e execute, nesta pasta:

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Criar o banco de dados e aplicar o modelo Prisma
npm run db:push

# 3. Rodar o seed (Dados de Demonstração)
npx prisma db seed

# 4. Iniciar o Servidor do App
npm run dev
```

Você poderá acessar `http://localhost:3000` no seu navegador!
