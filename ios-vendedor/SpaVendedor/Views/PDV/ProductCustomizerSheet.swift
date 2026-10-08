import SwiftUI

public struct ProductCustomizerSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    public let product: Product
    public let onAddToCart: (CustomizationOptions, Int) -> Void

    @State private var options = CustomizationOptions()
    @State private var quantity = 1

    public init(product: Product, onAddToCart: @escaping (CustomizationOptions, Int) -> Void) {
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

    private var isMattressType: Bool {
        product.isColchao || product.isReformaColchao || product.isReformaConjunto || product.isColchaoNovo
    }

    private var isBoxType: Bool {
        product.isBox || product.isCamaBox || product.isReformaBox || product.isReformaConjunto
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

                // MARK: - Colchão: Camada Extra de Espuma (Pillow Top)
                if isMattressType {
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
                        Text("1. Camada Extra de Espuma (Pillow Top)")
                    }

                    // MARK: - Colchão: Tecido do Tampo Superior
                    Section {
                        Picker("Tecido do Tampo", selection: $options.topFabric) {
                            Text("Matelassê Branco Acolchoado (Padrão de Fábrica)").tag("Matelassê Branco Acolchoado")
                            Text("Matelassê Bege Linho (Requinte)").tag("Matelassê Bege Linho")
                            Text("Matelassê Cinza Grafite (Moderno)").tag("Matelassê Cinza Grafite")
                            Text("Mesmo Tecido da Faixa Lateral (Monocromático)").tag("Mesmo Tecido da Faixa Lateral")
                        }
                        .pickerStyle(.menu)
                    } header: {
                        Text("2. Tecido do Tampo Superior (Superfície)")
                    }
                }

                // MARK: - Revestimento / Faixa Lateral (Veludo Spa)
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
                    Text(isMattressType ? "3. Cor do Tecido Lateral (Veludo)" : "1. Cor do Revestimento do Box (Veludo)")
                }

                // MARK: - Fitilho de Fechamento (Debrum)
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

                // MARK: - Box / Cama Box: Pés
                if isBoxType {
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
                        Text("Pés da Cama Box")
                    }
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
                            Text("Preço Base Unitário")
                                .foregroundStyle(Color.secondary)
                            Spacer()
                            Text(formatCurrency(product.defaultPrice))
                        }

                        if options.extraPrice > 0 {
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
            .navigationTitle("Personalizar Item")
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

    private var computedUnit: Double {
        product.defaultPrice + options.extraPrice
    }

    private var computedTotal: Double {
        computedUnit * Double(quantity)
    }

    private func handleAdd() {
        onAddToCart(options, quantity)
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
