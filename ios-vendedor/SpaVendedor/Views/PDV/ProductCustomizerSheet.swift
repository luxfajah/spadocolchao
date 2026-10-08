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
    }

    public var body: some View {
        NavigationStack {
            Form {
                // Resumo do Produto
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(product.name)
                            .font(.headline)
                        if let desc = product.description {
                            Text(desc)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // Tamanho e Dimensões
                if product.isColchao || product.isReforma || product.isBox {
                    Section("Tamanho Comercial") {
                        Picker("Medida", selection: $options.size) {
                            ForEach(MattressSize.allCases, id: \.self) { size in
                                Text(size.rawValue).tag(size)
                            }
                        }

                        if options.size == .sobMedida {
                            HStack {
                                Text("Largura (cm)")
                                Spacer()
                                TextField("138", value: $options.customWidth, format: .number)
                                    .keyboardType(.decimalPad)
                                    .multilineTextAlignment(.trailing)
                            }
                            HStack {
                                Text("Comprimento (cm)")
                                Spacer()
                                TextField("188", value: $options.customLength, format: .number)
                                    .keyboardType(.decimalPad)
                                    .multilineTextAlignment(.trailing)
                            }
                            HStack {
                                Text("Altura (cm)")
                                Spacer()
                                TextField("25", value: $options.customHeight, format: .number)
                                    .keyboardType(.decimalPad)
                                    .multilineTextAlignment(.trailing)
                            }
                        }
                    }

                    // Camada Extra de Conforto (Espuma)
                    Section("Camada Extra de Espuma (Pillow Top)") {
                        Picker("Opção de Espuma", selection: $options.extraFoam) {
                            ForEach(ExtraFoamType.allCases, id: \.self) { foam in
                                HStack {
                                    Text(foam.rawValue)
                                    if foam.price > 0 {
                                        Text("+\(formatCurrency(foam.price))")
                                            .foregroundStyle(.secondary)
                                    }
                                }.tag(foam)
                            }
                        }

                        if options.extraFoam != .none {
                            HStack {
                                Image(systemName: "sparkles")
                                    .foregroundStyle(.blue)
                                Text("Espuma de alta resiliência certificada, cortada sob medida na fábrica.")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    // Revestimento & Tecido
                    Section("Tecido & Revestimento") {
                        Picker("Tipo de Tecido", selection: $options.fabricType) {
                            Text("Malha Belga Especial (Tampo)").tag("Malha Belga Especial")
                            Text("Suede Premium (Camurça)").tag("Suede Premium")
                            Text("Linho Nobre Cru").tag("Linho Nobre Cru")
                            Text("Bouclé Conforto Off-White").tag("Bouclé Conforto")
                            Text("Facto / Courvin Impermeável").tag("Courvin Impermeável")
                        }

                        Picker("Cor Predominante", selection: $options.fabricColor) {
                            Text("Branco / Fios Prata").tag("Branco com Fios Prata")
                            Text("Cinza Chumbo").tag("Cinza Chumbo")
                            Text("Bege Areia").tag("Bege Areia")
                            Text("Off-White Neve").tag("Off-White Neve")
                            Text("Azul Petróleo").tag("Azul Petróleo")
                        }
                    }

                    // Pés (se for Box ou Reforma de Box)
                    if product.isBox {
                        Section("Pés da Cama Box") {
                            Picker("Modelo dos Pés", selection: $options.feetType) {
                                Text("Madeira Maciça Tabaco 12cm").tag("Madeira Tabaco 12cm")
                                Text("Madeira Natural Mel 12cm").tag("Madeira Mel 12cm")
                                Text("Aço Cromado Moderno 12cm").tag("Aço Cromado 12cm")
                                Text("Com Rodízios Giratórios").tag("Com Rodízios")
                            }
                        }
                    }

                    // Observações Técnicas
                    Section("Observações do Pedido") {
                        TextField("Detalhes específicos ou exigências do cliente", text: $options.observations)
                    }
                }

                // Quantidade
                Section("Quantidade") {
                    Stepper(value: $quantity, in: 1...20) {
                        HStack {
                            Text("Quantidade")
                            Spacer()
                            Text("\(quantity)")
                                .bold()
                        }
                    }
                }

                // Resumo de Valor
                Section {
                    VStack(spacing: 8) {
                        HStack {
                            Text("Preço Base Unitário")
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(formatCurrency(product.defaultPrice))
                        }

                        if options.extraPrice > 0 {
                            HStack {
                                Text("Opcionais / Espuma")
                                    .foregroundStyle(.blue)
                                Spacer()
                                Text("+\(formatCurrency(options.extraPrice))")
                                    .foregroundStyle(.blue)
                            }
                        }

                        Divider()

                        HStack {
                            Text("Valor Total")
                                .font(.headline)
                            Spacer()
                            Text(formatCurrency(computedTotal))
                                .font(.title3.bold())
                                .foregroundStyle(.blue)
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
