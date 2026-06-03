#!/bin/bash
# =====================================================
# DEPLOY iOS - Spa do Colchão
# Execute este script no Mac após clonar/atualizar o repo
# =====================================================

set -e

echo "=========================================="
echo "  🍎 Deploy iOS - Spa do Colchão"
echo "=========================================="

# 1. Atualizar repositório
echo ""
echo "📥 Atualizando repositório..."
git pull origin main

# 2. Instalar dependências do projeto principal
echo ""
echo "📦 Instalando dependências principais..."
npm install

# 3. ---- VENDEDOR ----
echo ""
echo "=========================================="
echo "  📱 App Vendedor - Spa do Colchão"
echo "=========================================="
cd mobile-vendedor
npm install

echo "🔄 Sincronizando Capacitor..."
npx cap copy ios
npx cap sync ios

echo "📲 Instalando CocoaPods..."
cd ios/App
pod install
cd ../..

echo "✅ Vendedor pronto! Abrindo no Xcode..."
npx cap open ios

# 4. ---- ENTREGADOR ----
echo ""
echo "=========================================="
echo "  🚚 App Entregas - Spa do Colchão"
echo "=========================================="
cd ../mobile-entregador
npm install

echo "🔄 Sincronizando Capacitor..."
npx cap copy ios
npx cap sync ios

echo "📲 Instalando CocoaPods..."
cd ios/App
pod install
cd ../..

echo "✅ Entregador pronto! Abrindo no Xcode..."
npx cap open ios

echo ""
echo "=========================================="
echo "  ✅ TUDO PRONTO!"
echo "=========================================="
echo ""
echo "Os dois projetos já estão abertos no Xcode."
echo ""
echo "Para cada um, faça:"
echo "  1. Selecione seu Team (Apple Developer Account)"
echo "  2. Selecione o dispositivo (iPhone ou simulador)"
echo "  3. Clique no botão ▶ Play para buildar e instalar"
echo ""
echo "Para gerar .ipa para distribuição:"
echo "  1. Product > Archive"
echo "  2. Distribute App > Ad Hoc ou App Store Connect"
echo ""
