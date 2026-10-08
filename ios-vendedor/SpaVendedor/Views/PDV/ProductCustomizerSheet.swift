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

    private var isConjunto: Bool {
        product.isConjunto
    }

    private var isOnlyBox: Bool {
        product.isOnlyBox
    }

    private var isOnlyColchao: Bool {
        product.isOnlyColchao
    }

    // Preço de tabela sugerido (base + opcionais de espuma do colchão se houver)
    private var suggestedPrice: Double {
        if isOnlyBox {
            // Em BOX NUNCA existe espuma extra
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

                        // Tags informativas de Categoria e Medida do Produto
                        HStack(spacing: 8) {
                            Text(product.categoryDisplayName)
                                .font(.caption2.bold())
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color.blue.opacity(0.12))
                                .foregroundStyle(Color.blue)
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

                        if let desc = product.description, !desc.isEmpty {
                            Text(desc)
                                .font(.caption)
                                .foregroundStyle(Color.secondary)
                        }

                        HStack {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.caption)
                                .foregroundStyle(Color.emerald)
                            Text("Padrão Ficha Técnica Spa do Colchão")
                                .font(.caption2.bold())
                                .foregroundStyle(Color.emerald)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // MARK: - 1. COLCHÃO: Espuma Extra e Tampo (Apenas para Colchão ou Conjunto)
                // REGRA: EM BOX NUNCA EXISTE ESPUMA EXTRA!
                if isConjunto || isOnlyColchao {
                    Section {
                        Picker("Camada de Conforto", selection: $options.extraFoam) {
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
                        .onChange(of: options.extraFoam) { _, _ in
                            // Se o preço negociado estiver vazio, atualiza o texto com o novo sugerido
                            if negotiatedPriceText.isEmpty {
                                negotiatedPriceText = String(format: "%.2f", suggestedPrice).replacingOccurrences(of: ".", with: ",")
                            }
                        }

                        if options.extraFoam != .none {
                            HStack(spacing: 8) {
                                Image(systemName: "sparkles")
                                    .foregroundStyle(Color.purple)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(options.extraFoam.badge)
                                        .font(.caption.bold())
                                        .foregroundStyle(Color.purple)
                                    Text("Espuma de alta densidade certificada cortada sob medida na fábrica.")
                                        .font(.caption2)
                                        .foregroundStyle(Color.secondary)
                                }
                            }
                            .padding(.vertical, 2)
                        }
                    } header: {
                        Text(isConjunto ? "1. Colchão: Camada Extra de Espuma (Pillow Top)" : "1. Camada Extra de Espuma (Pillow Top)")
                    }

                    // Tecido do Tampo Superior do Colchão
                    Section {
                        Picker("Tecido do Tampo", selection: $options.topFabric) {
                            Text("Matelassê Branco Acolchoado (Padrão de Fábrica)").tag("Matelassê Branco Acolchoado")
                            Text("Matelassê Bege Linho (Requinte)").tag("Matelassê Bege Linho")
                            Text("Matelassê Cinza Grafite (Moderno)").tag("Matelassê Cinza Grafite")
                            Text("Mesmo Tecido da Faixa Lateral (Monocromático)").tag("Mesmo Tecido da Faixa Lateral")
                        }
                        .pickerStyle(.menu)
                    } header: {
                        Text(isConjunto ? "2. Colchão: Tecido do Tampo Superior" : "2. Tecido do Tampo Superior")
                    }
                }

                // MARK: - 2. CAMA BOX: Pés do Box (Apenas para Box ou Conjunto)
                // REGRA: EM COLCHÃO AVULSO NÃO EXISTE PÉS DE BOX!
                if isConjunto || isOnlyBox {
                    Section {
                        Picker("Modelo dos Pés", selection: $options.feetType) {
                            Text("Pé Plástico 12cm Preto (Padrão Box)").tag("Pé Plástico 12cm Preto")
                            Text("Pé Plástico 6cm Rebaixado (Ideal p/ Baú)").tag("Pé Plástico 6cm Rebaixado")
                            Text("Pé Madeira Maciça 12cm (Elegance)").tag("Pé Madeira Maciça 12cm")
                            Text("Pés c/ Rodízio Móvel (Praticidade)").tag("Pés c/ Rodízio Móvel")
                            Text("Sem Pés (Embutido / Alvenaria)").tag("Sem Pés")
                        }
                        .pickerStyle(.menu)
                    } header: {
                        Text(isConjunto ? "3. Cama Box: Modelo dos Pés" : "1. Cama Box: Modelo dos Pés")
                    }
                }

                // MARK: - 3. REVESTIMENTO COORDENADO: VELUDO & FITILHO
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Cor Selecionada: \(options.fabricColor)")
                            .font(.subheadline.bold())

                        // Cartela visual de cores com chips
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
                } header: {
                    if isConjunto {
                        Text("4. Revestimento Coordenado (Faixas Colchão & Box)")
                    } else if isOnlyBox {
                        Text("2. Revestimento do Box (Veludo)")
                    } else {
                        Text("3. Revestimento Lateral (Veludo)")
                    }
                }

                // Fitilho de Acabamento (Debrum)
                Section {
                    Picker("Modelo do Fitilho", selection: $options.fitilho) {
                        Text("Fitilho Tom sobre Tom (Harmônico)").tag("Fitilho Tom sobre Tom")
                        Text("Fitilho Branco Clássico (Contraste)").tag("Fitilho Branco Clássico")
                        Text("Fitilho Bege Linho (Neutro)").tag("Fitilho Bege Linho")
                        Text("Fitilho Cinza Grafite (Moderno)").tag("Fitilho Cinza Grafite")
                        Text("Fitilho Preto Ônix (Marcante)").tag("Fitilho Preto Ônix")
                        Text("Fitim Colméia Especial (Linha Especial)").tag("Fitim Colméia Especial")
                    }
                    .pickerStyle(.menu)
                } header: {
                    Text("Fitilho de Fechamento (Debrum)")
                }

                // MARK: - 4. PREÇO UNITÁRIO NEGOCIADO & DESCONTO (EDITÁVEL PELO VENDEDOR)
                Section {
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

                        // Campo de Preço Unitário Digitável
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
                                Text("Justificativa da Negociação:")
                                    .font(.caption2.bold())
                                    .foregroundStyle(Color.secondary)
                                TextField("Ex: Fechado à vista, autorizado pela gerência...", text: $priceJustification)
                                    .font(.caption)
                                    .textFieldStyle(.roundedBorder)
                            }
                            .padding(.top, 4)
                        }
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Preço Unitário & Negociação")
                }

                // MARK: - Observações Técnicas
                Section("Observações Técnicas do Pedido") {
                    TextField("Ex: Reforço lateral, zíper duplo, cliente alérgico...", text: $options.observations)
                }

                // MARK: - Quantidade
                Section("Quantidade") {
                    Stepper(value: $quantity, in: 1...20) {
                        HStack {
                            Text("Quantidade")
                            Spacer()
                            Text("\(quantity)")
                                .font(.headline.bold())
                        }
                    }
                }

                // MARK: - Resumo Financeiro do Item
                Section {
                    VStack(spacing: 8) {
                        HStack {
                            Text("Preço Unitário Praticado")
                                .foregroundStyle(Color.secondary)
                            Spacer()
                            Text(formatCurrency(effectiveUnitPrice))
                                .bold()
                        }

                        if !isOnlyBox && options.extraPrice > 0 {
                            HStack {
                                Text("Opcional: \(options.extraFoam.badge)")
                                    .foregroundStyle(Color.blue)
                                Spacer()
                                Text("+\(formatCurrency(options.extraPrice))")
                                    .foregroundStyle(Color.blue)
                            }
                        }

                        Divider()

                        HStack {
                            Text("Valor Total (\(quantity)x)")
                                .font(.headline)
                            Spacer()
                            Text(formatCurrency(computedTotal))
                                .font(.title3.bold())
                                .foregroundStyle(Color.blue)
                        }
                    }
                }
            }
            .navigationTitle(isConjunto ? "Personalizar Conjunto" : (isOnlyBox ? "Personalizar Box" : "Personalizar Colchão"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(action: handleAdd) {
                        Text("Adicionar")
                            .bold()
                    }
                }
            }
        }
    }

    private func handleAdd() {
        onAddToCart(
            options,
            quantity,
            effectiveUnitPrice,
            priceJustification.isEmpty ? nil : priceJustification.trimmingCharacters(in: .whitespacesAndNewlines)
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

// Extensão segura de cor hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
