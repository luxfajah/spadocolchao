# 📲 Como Compilar no GitHub e Instalar no iPhone via Sideloader

Este guia explica como compilar o **App do Vendedor (Spa do Colchão)** nas máquinas na nuvem do GitHub (macOS Runner) e instalar o arquivo `.ipa` no iPhone usando qualquer ferramenta de Sideload (**Sideloadly, AltStore, SideStore, Scarlet ou TrollStore**).

---

## ☁️ 1. Como disparar a compilação no GitHub

O workflow do GitHub Actions já está configurado em [`.github/workflows/build-ios.yml`](../.github/workflows/build-ios.yml).

### Opção A: Automático via Git Push
Toda vez que você enviar um `git push` para o branch `main` contendo alterações na pasta `ios-vendedor/`, o GitHub compilará o aplicativo automaticamente em um Mac na nuvem.

### Opção B: Manual (com 1 clique no GitHub)
1. Acesse o seu repositório no GitHub: `https://github.com/luxfajah/spadocolchao`
2. Clique na aba **Actions** no topo.
3. Na barra lateral esquerda, clique em **Build iOS Apps (Sideloadable IPA)**.
4. Clique no botão **Run workflow** ➔ Selecione a branch `main` ➔ Clique em **Run workflow**.

---

## 📥 2. Como Baixar o arquivo .IPA compilado

1. Quando a execução terminar (geralmente leva ~2 a 3 minutos), clique nela na lista.
2. Role até a seção **Artifacts** no final da página.
3. Clique em **`SpaVendedor-iOS`** para baixar o arquivo zip.
4. Extraia o arquivo `.zip` para obter o seu `SpaVendedor.ipa`.

---

## ⚡ 3. Como Instalar no iPhone usando o Sideloadly (Recomendado)

O **Sideloadly** é o sideloader mais simples e compatível (funciona no Mac e no Windows):

1. Se ainda não tiver, baixe o [Sideloadly gratuitamente](https://sideloadly.io/).
2. Abra o Sideloadly no computador e conecte seu iPhone via cabo USB.
3. No Sideloadly:
   - Seu iPhone aparecerá selecionado no campo **Device**.
   - Digite o seu **Apple ID** (sua conta da Apple normal e gratuita).
   - Arraste o arquivo **`SpaVendedor.ipa`** para dentro do quadrado grande do Sideloadly.
4. Clique no botão **Start**.
5. Se for a primeira vez, o Sideloadly pedirá a senha do seu Apple ID (utilizada apenas para gerar o certificado de assinatura de 7 dias da Apple).
6. Aguarde alguns segundos até a mensagem `DONE`. O app **Spa Vendedor** aparecerá imediatamente na tela inicial do seu iPhone!

---

## 🔓 4. Primeiro Acesso no iPhone (Permitir Certificado)

Na primeira vez que tentar abrir o app, o iOS pode exibir a mensagem *"Desenvolvedor Empresarial Não Confiável"* ou *"Desenvolvedor Não Confiável"*:

1. No seu iPhone, abra **Ajustes**.
2. Vá em **Geral > VPN e Gerenciamento de Dispositivos**.
3. Em *App de Desenvolvedor*, clique sobre o seu e-mail do Apple ID.
4. Clique em **Confiar em [Seu Nome/E-mail]**.
5. (Se o iOS 16/17/18 pedir Modo de Desenvolvedor): Vá em **Ajustes > Privacidade e Segurança > Modo de Desenvolvedor** e ative.
6. Pronto! Abra o aplicativo **Spa Vendedor** e aproveite.

---

## 🔄 5. Dica de Renovação (Validade de 7 dias)

Pelas regras da Apple para contas gratuitas de desenvolvedor:
- O app fica ativo por 7 dias.
- Para renovar, basta conectar o iPhone e clicar em **Start** no Sideloadly novamente (ou ativar a opção *Wi-Fi sideloading* no Sideloadly para renovar automaticamente sem fio enquanto estiver na mesma rede Wi-Fi).
