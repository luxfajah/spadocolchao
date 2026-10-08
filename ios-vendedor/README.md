# 🛏️ Spa do Colchão - App do Vendedor (iOS Nativo Swift)

Aplicativo oficial para o time comercial da **Spa do Colchão**, desenvolvido em **Swift 6 / SwiftUI (iOS 17+)**.

## 🌟 Funcionalidades Implementadas

### 1. 🛍️ Ponto de Venda Express (PDV Mobile)
- Catálogo de colchões novos, reformas de colchão, reformas de cama box e acessórios.
- **Personalizador Técnico Dinâmico**:
  - Seleção de medidas (Solteiro, Casal, Queen, King, Sob Medida).
  - Camadas extras de conforto com cálculo de preço e densidade (Espuma D28, D33, D45).
  - Amostras de tecidos nobres (Malha Belga com fios de prata, Linho Cru, Suede Premium, Bouclé, Courvin impermeável).
  - Opções de pés de madeira, cromado e rodízios para cama box.
- Carrinho de compras reativo com swipe para remover e controle de quantidades.
- Seleção de cliente existente ou cadastro express diretamente na tela de checkout.
- Opções de pagamento: PIX à vista, Cartão de Crédito parcelado até 12x, Débito, Boleto e Dinheiro.
- **Cálculo de Comissão em Tempo Real**: O vendedor visualiza exatamente quanto vai lucrar naquela venda antes de finalizar.
- Emissão de comprovante instantâneo com botão nativo para compartilhar via **WhatsApp** com o cliente.

### 2. 📋 Acompanhamento de Pedidos (Kanban de Produção)
- Visualização de pedidos em tempo real:
  - `Vendido`
  - `Aguardando Medidas / Preparação`
  - `Em Produção na Fábrica`
  - `Em Rota de Entrega`
  - `Entregue ao Cliente`
- Linha do tempo visual de etapas da fabricação do colchão/box.
- Ações rápidas de contato com o cliente: discar por telefone (`tel:`) ou iniciar conversa no WhatsApp com 1 toque.

### 3. 🎯 Metas & Performance
- Gráfico circular dinâmico de progresso da meta mensal.
- Painel de métricas: Vendas de Hoje, Ticket Médio, Total Faturado no Mês e Comissão Acumulada.
- Estimativas de bônus e valor restante para bater a meta.

### 4. 📍 Gestão de Visitas Externas & Prospecção
- Lista de visitas agendadas para atendimento residencial e comercial (hotéis, pousadas, clínicas).
- Traçar rota no **Apple Maps** ou Waze com 1 toque.
- **Check-in via GPS (`CoreLocation`)**: Grava a localização e horário exato da visita com sincronização em nuvem.
- Agendamento de novas visitas integrado com anotações de interesses do cliente.

### 5. 🔐 Autenticação & Segurança
- Login seguro integrado com a base de dados do sistema.
- Suporte a **Face ID / Touch ID** com o framework `LocalAuthentication`.
- Alternância de servidor e modo de demonstração/offline automático para uso sem conexão.

---

## 🏗️ Estrutura do Código

```
ios-vendedor/
├── SpaVendedor.xcodeproj/        # Projeto oficial do Xcode (abrir com 2 cliques)
│   └── project.pbxproj
├── SpaVendedor/
│   ├── App/
│   │   ├── SpaVendedorApp.swift   # Ponto de entrada @main
│   │   └── AppState.swift         # Store reativo @Observable
│   ├── Models/
│   │   ├── User.swift             # Usuário e autenticação
│   │   ├── Product.swift          # Catálogo e tipos de produtos
│   │   ├── CartItem.swift         # Itens do carrinho e personalização
│   │   ├── Customer.swift         # Clientes
│   │   ├── Order.swift            # Pedidos e etapas de produção
│   │   ├── Goal.swift             # Metas financeiras e estatísticas
│   │   └── Visit.swift            # Visitas externas e check-in
│   ├── Services/
│   │   ├── APIClient.swift        # Networking async/await com fallback offline
│   │   ├── LocationManager.swift  # GPS CoreLocation
│   │   └── BiometricManager.swift # Face ID / Touch ID
│   ├── Views/
│   │   ├── RootView.swift         # Roteador de navegação
│   │   ├── MainTabView.swift      # 5 abas de navegação principais
│   │   ├── Auth/LoginView.swift   # Login com Liquid Glass
│   │   ├── PDV/                   # Catálogo, customizador, carrinho e sucesso
│   │   ├── Kanban/                # Acompanhamento e detalhes do pedido
│   │   ├── Metas/                 # Painel circular de performance
│   │   ├── Visitas/               # Visitas com mapa e check-in
│   │   └── Perfil/                # Conta do vendedor e configurações
│   ├── Components/                # GlassCard, StatusBadge, MetricCard, BrandHeader
│   └── Resources/                 # Assets.xcassets e Info.plist
├── Package.swift                  # Suporte nativo a Swift Package Manager
└── COMO_RODAR_NO_XCODE.md         # Manual ilustrado de execução
```
