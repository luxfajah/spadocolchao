# Plano de Implementação: Fase C (Interface Web)

A Fase C será focada no desenvolvimento e aprimoramento da Interface do Usuário (UI) para o Spa do Colchão ERP, integrando o banco Prisma com as telas.

## 1. Layout Refinado (Dashboard Base)
- [ ] Aprimorar `src/app/dashboard/layout.tsx` para ser totalmente responsivo.
- [ ] Adicionar navegação secundária, breadcrumbs e cabeçalhos dinâmicos.
- [ ] Micro-interações nos botões do sidebar e menus de conta.

## 2. CRUDs (Telas de Listagem e Criação)
- Padrão a adotar: Tabela com paginação, filtros e modais (Slide-overs) para criação/edição.
- [ ] **Clientes (`/dashboard/customers`)**: Interface para formulário e listagem.
- [ ] **Geral (`/dashboard/suppliers`, etc)**: Adotaremos Server Actions para conectar com o banco.

## 3. Kanban de Produção (Pedidos)
- [ ] Rota: `/dashboard/orders`
- [ ] Interface visual ao estilo "Trello" usando drag-and-drop.
- [ ] Colunas: Recebido > Produção > Finalizado.
- [ ] Integração com Server Actions para o status no Prisma.

## 4. Dashboards
- [ ] Rota: `/dashboard`
- [ ] **Métricas**: Cards com Resumo Mensal (Vendas, Meta, Leads).
- [ ] **Gráficos**: Integração do `recharts` ou equivalente com Tailwind.

## 5. Filtros e Pesquisas Globais
- [ ] Retenção de estado de pesquisa na URL (`?status=ativo&search=termo`) para links compartilháveis e busca rápida.
- [ ] Componentização de inputs e selects de filtro (Shadcn UI).
