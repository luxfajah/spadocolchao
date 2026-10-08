# 📱 Guia de Execução no Xcode & Instalação no iPhone - Spa do Colchão Vendedor

Este projeto foi construído em **Swift 6 / SwiftUI Nativo (iOS 17+)**, seguindo à risca as diretrizes oficiais da Apple (**Human Interface Guidelines**) e a arquitetura moderna com **Observation Framework (`@Observable`)**, design **Liquid Glass (`.ultraThinMaterial`)** e comunicação assíncrona **`async/await`** com a API do sistema.

---

## 🚀 1. Como Abrir no Xcode

Como o seu Mac possui o Swift instalado:

1. Baixe o **Xcode** gratuitamente na **Mac App Store** (ou certifique-se de que o Xcode esteja instalado em `/Applications`).
2. Abra o terminal ou o Finder e dê dois cliques no arquivo:
   ```bash
   open /Users/luxfajah/spadocolchao/ios-vendedor/SpaVendedor.xcodeproj
   ```
   *(Ou no Xcode: **File > Open** e selecione a pasta `ios-vendedor`)*.

---

## 📲 2. Como Rodar no Simulador do iPhone

1. No topo da janela do Xcode, ao lado do botão **▶ (Play)**, selecione o destino:
   - Exemplo: **iPhone 16 Pro** ou **iPhone 15**.
2. Clique no botão **▶ Play** (ou pressione `Command + R`).
3. O simulador do iPhone abrirá com o app instalado e pronto para testar!

---

## 🔌 3. Como Instalar no iPhone Físico (Sem precisar de conta paga)

Você pode instalar e usar o app diretamente no seu iPhone pessoal usando qualquer conta Apple ID comum gratuita:

1. Conecte seu iPhone ao Mac pelo cabo USB (ou Wi-Fi).
2. No Xcode:
   - Selecione o projeto **SpaVendedor** na barra lateral esquerda.
   - Vá na aba **Signing & Capabilities**.
   - Em **Team**, clique em **Add an Account...** e faça login com seu Apple ID comum.
   - Marque a opção **Automatically manage signing**.
3. No seu iPhone:
   - Vá em **Ajustes > Privacidade e Segurança > Modo de Desenvolvedor (Developer Mode)** e ative.
   - O iPhone pedirá para reiniciar.
4. No Xcode, selecione o seu iPhone na lista de dispositivos no topo e clique em **▶ Play**.
5. Quando o app instalar, na primeira abertura o iOS pode pedir para confiar no certificado de desenvolvedor:
   - Vá em **Ajustes > Geral > Gerenciamento de Dispositivos e VPN** e clique em **Confiar em [Seu Nome/Apple ID]**.

---

## 🌐 4. Conexão com o Sistema e Modo Offline

- **Produção Online**: Por padrão, o app conecta diretamente na API de produção:
  `https://spadocolchao.vercel.app`
- **Modo Offline / Demonstração**:
  Caso você esteja sem sinal ou em visita externa sem internet, o aplicativo opera automaticamente em modo de fallback, permitindo navegar no catálogo, simular pedidos e calcular comissões sem travar.
- **Ambiente Local**:
  Na tela de **Login** ou na aba de **Perfil**, você pode clicar em **Alterar Servidor** para apontar para `http://seu-ip-local:3000` durante o desenvolvimento.

---

## 🗺️ 5. Próximos Passos (Roadmap da Suíte Mobile)

1. ✅ **App do Vendedor (Nativo Swift/iOS)** — Concluído (PDV, Catálogo, Personalização de Espumas/Tecidos, Carrinho, Comissão em Tempo Real, Kanban de Pedidos, Metas e Visitas com GPS).
2. ⏳ **App do Gestor (Nativo Swift/iOS)** — Dashboard executivo com faturamento diário/mensal, aprovações financeiras, estoque crítico e métricas gerais do ERP.
3. ⏳ **App do Entregador (Nativo Swift/iOS)** — Rotas no Apple Maps, confirmação de entrega com foto de comprovante anexada à câmera do iPhone e assinatura digital do cliente na tela.
