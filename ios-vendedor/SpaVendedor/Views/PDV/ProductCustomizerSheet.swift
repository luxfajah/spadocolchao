import SwiftUI

public struct ProductCustomizerSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    public let product: Product
    public let onAddToCart: (CustomizationOptions, Int, Double, String?) -> Void

    @State private var options = CustomizationOptions()
    @State private var quantity = 1

    // Preço Negociado Digitável
    @State private var negotiatedPriceText = ""
    @State private var priceJustification = ""

    public init(
        product: Product,
        onAddToCart: @escaping (CustomizationOptions, Int, Double, String?) -> Void
    ) {
        self.product = product
        self.onAddToCart = onAddToCart

        var initialOptions = CustomizationOptions()
        if let detected = product.detectedSize {
            switch detected {
            case "Solteiro": initialOptions.size = .solteiro
            case "Queen": initialOptions.size = .queen
            case "King": initialOptions.size = .king
            case "Sob Medida": initialOptions.size = .sobMedida
            default: initialOptions.size = .casal
            }
        }
        _options = State(initialValue: initialOptions)
    }

    private var isReforma: Bool {
        product.isReforma ||
        (product.operationalCategory?.localizedCaseInsensitiveContains("reforma") ?? false)
    }

    private var isConjunto: Bool {
        product.isConjunto
    }

    private var isOnlyBox: Bool {
        product.isOnlyBox
    }

    private var isOnlyColchao: Bool {
        product.isOnlyColchao
    }

    // Preço de tabela sugerido
    private var suggestedPrice: Double {
        if isOnlyBox {
            // Em BOX NUNCA existe espuma extra ou vibro
            return product.defaultPrice
        }
        return product.defaultPrice + options.extraPrice
    }

    private var effectiveUnitPrice: Double {
        let cleaned = negotiatedPriceText.replacingOccurrences(of: ",", with: ".")
        if let val = Double(cleaned), val > 0 {
            return val
        }
        return suggestedPrice
    }

    private var computedTotal: Double {
        effectiveUnitPrice * Double(quantity)
    }

    public var body: some View {
        NavigationStack {
            Form {
                // MARK: - Cabeçalho do Produto
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(product.name)
                                .font(.headline.bold())
                            Spacer()
                        }

                        // Tags informativas
                        HStack(spacing: 8) {
                            Text(isReforma ? "Reforma" : "Linha Nova")
                                .font(.caption2.bold())
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(isReforma ? Color.orange.opacity(0.12) : Color.blue.opacity(0.12))
                                .foregroundStyle(isReforma ? Color.orange : Color.blue)
                                .clipShape(Capsule())

                            if let sizeName = product.detectedSize {
                                Text(sizeName)
                                    .font(.caption2.bold())
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.purple.opacity(0.12))
                                    .foregroundStyle(Color.purple)
                                    .clipShape(Capsule())
                            }

                            Spacer()
                        }

                        if !isReforma && (isOnlyColchao || isConjunto) {
                            HStack(alignment: .top, spacing: 6) {
                                Image(systemName: "info.circle.fill")
                                    .font(.caption)
                                    .foregroundStyle(Color.blue)
                                Text("Padrão da Linha Homologado: densidade, molas e camadas de conforto seguem a ficha técnica original deste modelo novo. Personalize as opções de tecido.")
                                    .font(.caption2)
                                    .foregroundStyle(Color.secondary)
                            }
                            .padding(.vertical, 2)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // ==========================================
                // CASO 1: REFORMA DE COLCHÃO OU CONJUNTO
                // ==========================================
                if isReforma && (isOnlyColchao || isConjunto) {
                    // 1. Tampo de Cima
                    Section("1. Tampo de Cima (Superfície Superior)") {
                        Picker("Tampo de Cima", selection: $options.topFabric) {
                            Text("Matelassê Branco Acolchoado (Padrão)").tag("Matelassê Branco Acolchoado")
                            Text("Matelassê Bege Linho (Requinte)").tag("Matelassê Bege Linho")
                            Text("Matelassê Cinza Grafite (Moderno)").tag("Matelassê Cinza Grafite")
                            Text("Mesmo Tecido da Faixa Lateral").tag("Mesmo Tecido da Faixa Lateral")
                        }
                        .pickerStyle(.menu)
                    }

                    // 2. Tampo de Baixo
                    Section("2. Tampo de Baixo (Superfície Inferior)") {
                        Picker("Tampo de Baixo", selection: $options.bottomFabric) {
                            Text("TNT Antiderrapante Preto 100g (Padrão 1 Face)").tag("TNT Antiderrapante Preto 100g")
                            Text("Matelassê Branco Acolchoado (Dupla Face)").tag("Matelassê Branco Acolchoado (Dupla Face)")
                            Text("Matelassê Bege Linho (Dupla Face)").tag("Matelassê Bege Linho (Dupla Face)")
                            Text("Mesmo Tecido da Faixa Lateral").tag("Mesmo Tecido da Faixa Lateral")
                        }
                        .pickerStyle(.menu)
                    }

                    // 3. Camada Adicional de Espuma (SÓ DE 5 CM)
                    Section("3. Camada Adicional de Espuma (Apenas 5 cm)") {
                        Picker("Camada de Espuma", selection: $options.extraFoam) {
                            ForEach(ExtraFoamType.allCases, id: \.self) { foam in
                                HStack {
                                    Text(foam.rawValue)
                                    if foam.price > 0 {
                                        Text("(+\(formatCurrency(foam.price)))")
                                            .foregroundStyle(Color.secondary)
                                    }
                                }.tag(foam)
                            }
                        }
                        .pickerStyle(.menu)

                        if options.extraFoam != .none {
                            Text("Espuma de alta resiliência cortada sob medida na fábrica para conforto ou firmeza.")
                                .font(.caption2)
                                .foregroundStyle(Color.secondary)
                        }
                    }

                    // 4. Conversão para Vibroterapia
                    Section("4. Conversão para Vibroterapia (Massagem)") {
                        Toggle(isOn: $options.isVibroConversion) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Instalar Vibroterapia c/ Controle")
                                    .font(.subheadline.bold())
                                Text("Cápsulas de massagem eletrônica e controle (+R$ 850,00)")
                                    .font(.caption2)
                                    .foregroundStyle(Color.secondary)
                            }
                        }
                        .tint(Color.purple)
                    }

                    // 5. Fitilho de Fechamento (Debrum)
                    Section("5. Fitilho de Fechamento (Debrum)") {
                        Picker("Modelo do Fitilho", selection: $options.fitilho) {
                            Text("Fitilho Tom sobre Tom (Harmônico)").tag("Fitilho Tom sobre Tom")
                            Text("Fitilho Branco Clássico (Contraste)").tag("Fitilho Branco Clássico")
                            Text("Fitilho Bege Linho (Neutro)").tag("Fitilho Bege Linho")
                            Text("Fitilho Cinza Grafite (Moderno)").tag("Fitilho Cinza Grafite")
                            Text("Fitilho Preto Ônix (Marcante)").tag("Fitilho Preto Ônix")
                        }
                        .pickerStyle(.menu)
                    }
                }

                // ==========================================
                // CASO 2: COLCHÃO NOVO (PADRÃO DA LINHA)
                // "os novos devem seguir o padrão da linha e as unicas personalizações são as opções de tecido"
                // ==========================================
                if !isReforma && (isOnlyColchao || isConjunto) {
                    Section("Opção de Tecido do Tampo (Colchão)") {
                        Picker("Tecido do Tampo", selection: $options.topFabric) {
                            Text("Matelassê Branco Acolchoado (Padrão Linha)").tag("Matelassê Branco Acolchoado")
                            Text("Matelassê Bege Linho (Requinte)").tag("Matelassê Bege Linho")
                            Text("Matelassê Cinza Grafite (Moderno)").tag("Matelassê Cinza Grafite")
                            Text("Mesmo Tecido da Faixa Lateral").tag("Mesmo Tecido da Faixa Lateral")
                        }
                        .pickerStyle(.menu)
                    }
                }

                // ==========================================
                // REVESTIMENTO LATERAL (FAIXA VELUDO / FORRAGEM)
                // ==========================================
                Section(header: Text(isOnlyBox ? "Tecido de Forragem do Box" : "Tecido Lateral (Faixa de Veludo)")) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Cor Selecionada: \(options.fabricColor)")
                            .font(.subheadline.bold())

                        // Cartela visual de cores
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 70))], spacing: 10) {
                            ForEach(FabricColorOption.standardColors) { colorOpt in
                                Button(action: {
                                    options.fabricColor = colorOpt.name
                                    options.fabricColorHex = colorOpt.hex
                                }) {
                                    VStack(spacing: 4) {
                                        ZStack {
                                            Circle()
                                                .fill(Color(hex: colorOpt.hex))
                                                .frame(width: 38, height: 38)
                                                .overlay(
                                                    Circle()
                                                        .stroke(options.fabricColor == colorOpt.name ? Color.blue : Color.gray.opacity(0.3), lineWidth: options.fabricColor == colorOpt.name ? 3 : 1)
                                                )

                                            if options.fabricColor == colorOpt.name {
                                                Image(systemName: "checkmark")
                                                    .font(.caption.bold())
                                                    .foregroundStyle(colorOpt.isLight ? Color.black : Color.white)
                                            }
                                        }

                                        Text(colorOpt.name.components(separatedBy: " ").first ?? colorOpt.name)
                                            .font(.system(size: 10, weight: .medium))
                                            .foregroundStyle(Color.primary)
                                            .lineLimit(1)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                // ==========================================
                // CASO BOX: TNT DE CIMA E PEZINHOS
                // "e o box: tnt de cima, tecido de forragem e pezinho"
                // ==========================================
                if isOnlyBox || isConjunto {
                    // TNT de Cima do Box
                    Section("TNT de Cima do Box (Superfície de Apoio)") {
                        Picker("TNT de Cima", selection: $options.topTNT) {
                            Text("TNT Antiderrapante Preto 100g/150g (Padrão)").tag("TNT Antiderrapante Preto 100g/150g")
                            Text("TNT Branco Reforçado").tag("TNT Branco Reforçado")
                            Text("TNT Bege Linho").tag("TNT Bege Linho")
                        }
                        .pickerStyle(.menu)
                    }

                    // Pezinhos do Box
                    Section("Pezinhos do Box") {
                        Picker("Modelo dos Pés", selection: $options.feetType) {
                            Text("Pé Madeira Maciça 12cm Tabaco (Padrão)").tag("Pé Madeira Maciça 12cm Tabaco")
                            Text("Pé Madeira Maciça 12cm Mel").tag("Pé Madeira Maciça 12cm Mel")
                            Text("Pé Plástico 12cm Preto").tag("Pé Plástico 12cm Preto")
                            Text("Pé Plástico 6cm Rebaixado (Ideal p/ Baú)").tag("Pé Plástico 6cm Rebaixado")
                            Text("Pé Alumínio Cromado 12cm").tag("Pé Alumínio Cromado 12cm")
                            Text("Pés c/ Rodízio Móvel (Praticidade)").tag("Pés c/ Rodízio Móvel")
                            Text("Sem Pés (Embutido / Alvenaria)").tag("Sem Pés")
                        }
                        .pickerStyle(.menu)
                    }
                }

                // MARK: - PREÇO UNITÁRIO NEGOCIADO & DESCONTO
                Section("Preço Unitário & Negociação") {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("Preço de Tabela Sugerido:")
                                .font(.caption)
                                .foregroundStyle(Color.secondary)
                            Spacer()
                            Text(formatCurrency(suggestedPrice))
                                .font(.caption.bold())
                                .foregroundStyle(Color.secondary)
                        }

                        // Campo Digitável
                        HStack {
                            Text("Preço Unitário Negociado:")
                                .font(.subheadline.bold())
                            Spacer()
                            HStack(spacing: 4) {
                                Text("R$")
                                    .font(.headline.bold())
                                    .foregroundStyle(Color.blue)
                                TextField(String(format: "%.2f", suggestedPrice), text: $negotiatedPriceText)
                                    .keyboardType(.decimalPad)
                                    .multilineTextAlignment(.trailing)
                                    .font(.title3.bold())
                                    .frame(width: 120)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(Color(uiColor: .tertiarySystemFill))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }

                        // Indicador de Desconto ou Acréscimo
                        if effectiveUnitPrice < suggestedPrice - 0.05 {
                            let discount = suggestedPrice - effectiveUnitPrice
                            let pct = (discount / suggestedPrice) * 100.0
                            HStack {
                                Image(systemName: "tag.fill")
                                    .foregroundStyle(Color.emerald)
                                Text("Desconto concedido: -\(formatCurrency(discount)) (\(String(format: "%.1f", pct))%)")
                                    .font(.caption.bold())
                                    .foregroundStyle(Color.emerald)
                                Spacer()
                                Button("Restaurar") {
                                    negotiatedPriceText = ""
                                }
                                .font(.caption2.bold())
                                .buttonStyle(.bordered)
                            }
                            .padding(.vertical, 2)
                        } else if effectiveUnitPrice > suggestedPrice + 0.05 {
                            let extra = effectiveUnitPrice - suggestedPrice
                            HStack {
                                Text("Acréscimo de negociação: +\(formatCurrency(extra))")
                                    .font(.caption.bold())
                                    .foregroundStyle(Color.blue)
                                Spacer()
                                Button("Restaurar") {
                                    negotiatedPriceText = ""
                                }
                                .font(.caption2.bold())
                                .buttonStyle(.bordered)
                            }
                        }

                        // Justificativa Comercial
                        if effectiveUnitPrice != suggestedPrice {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Justificativa Comercial:")
                                    .font(.caption2.bold())
                                    .foregroundStyle(Color.secondary)
                                TextField("Ex: Fechamento à vista, autorizado pela gerência...", text: $priceJustification)
                                    .font(.caption)
                                    .textFieldStyle(.roundedBorder)
                            }
                            .padding(.top, 4)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // Observações Técnicas
                Section("Observações Técnicas do Pedido") {
                    TextField("Ex: Reforço especial, zíper duplo, cliente alérgico...", text: $options.observations)
                }

                // MARK: - Quantidade
                Section("Quantidade") {
                    Stepper("Unidades: \(quantity)", value: $quantity, in: 1...99)
                }
            }
            .navigationTitle("Personalização")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(action: handleConfirm) {
                        Text("Adicionar • \(formatCurrency(computedTotal))")
                            .bold()
                    }
                }
            }
        }
    }

    private func handleConfirm() {
        onAddToCart(
            options,
            quantity,
            effectiveUnitPrice,
            priceJustification.isEmpty ? nil : priceJustification
        )
        dismiss()
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: NSNumber(value: value)) ?? "R$ \(value)"
    }
}
