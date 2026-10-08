import SwiftUI

public struct ProductCardView: View {
    @Environment(AppState.self) private var appState
    public let product: Product
    public let onCustomize: (() -> Void)?

    public init(product: Product, onCustomize: (() -> Void)? = nil) {
        self.product = product
        self.onCustomize = onCustomize
    }

    public var body: some View {
        let quantity = appState.itemQuantity(for: product)

        GlassCard(cornerRadius: 18) {
            VStack(alignment: .leading, spacing: 12) {
                // Top Header: Ícone, Nome da Categoria e Badge de Tamanho
                HStack(alignment: .top, spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(badgeColor.opacity(0.12))
                            .frame(width: 44, height: 44)
                        Image(systemName: iconName)
                            .font(.system(size: 20))
                            .foregroundStyle(badgeColor)
                    }

                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 6) {
                            Text(product.categoryDisplayName)
                                .font(.system(size: 10, weight: .black))
                                .textCase(.uppercase)
                                .foregroundStyle(badgeColor)

                            if let size = product.detectedSize {
                                Text(size)
                                    .font(.system(size: 9, weight: .bold))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundStyle(Color.blue)
                                    .clipShape(Capsule())
                            }
                        }

                        Text(product.name)
                            .font(.headline)
                            .foregroundStyle(Color.primary)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                    }

                    Spacer()
                }

                if let desc = product.description, !desc.isEmpty {
                    Text(desc)
                        .font(.caption)
                        .foregroundStyle(Color.secondary)
                        .lineLimit(2)
                }

                Divider()

                // Bottom Footer: Preço + Ações Rápidas
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("PREÇO")
                            .font(.system(size: 8, weight: .black))
                            .foregroundStyle(Color.secondary)
                        Text(formatCurrency(product.defaultPrice))
                            .font(.title3.bold())
                            .foregroundStyle(Color.primary)
                    }

                    Spacer()

                    // Controles de Adição ao Carrinho
                    HStack(spacing: 8) {
                        if onCustomize != nil && (product.isColchao || product.isReforma || product.isBox) {
                            Button(action: { onCustomize?() }) {
                                Image(systemName: "slider.horizontal.3")
                                    .font(.subheadline)
                                    .foregroundStyle(Color.secondary)
                                    .frame(width: 36, height: 36)
                                    .background(Color(uiColor: .tertiarySystemFill))
                                    .clipShape(Circle())
                            }
                        }

                        if quantity > 0 {
                            // Stepper interativo
                            HStack(spacing: 6) {
                                Button(action: { appState.updateQuantity(for: product, delta: -1) }) {
                                    Image(systemName: "minus")
                                        .font(.caption.bold())
                                        .foregroundStyle(Color.primary)
                                        .frame(width: 28, height: 28)
                                        .background(Color.white)
                                        .clipShape(Circle())
                                }

                                Text("\(quantity)")
                                    .font(.subheadline.bold())
                                    .frame(minWidth: 20)
                                    .multilineTextAlignment(.center)
                                    .foregroundStyle(Color.primary)

                                Button(action: { appState.updateQuantity(for: product, delta: 1) }) {
                                    Image(systemName: "plus")
                                        .font(.caption.bold())
                                        .foregroundStyle(Color.white)
                                        .frame(width: 28, height: 28)
                                        .background(Color.blue)
                                        .clipShape(Circle())
                                }
                            }
                            .padding(4)
                            .background(Color(uiColor: .secondarySystemFill))
                            .clipShape(Capsule())
                        } else {
                            // Botão Adicionar 1-toque
                            Button(action: { appState.updateQuantity(for: product, delta: 1) }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "plus")
                                        .font(.caption.bold())
                                    Text("Adicionar")
                                        .font(.caption.bold())
                                }
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(Color.blue)
                                .foregroundStyle(Color.white)
                                .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
        }
    }

    private var iconName: String {
        if product.isReformaConjunto { return "bed.double.circle.fill" }
        if product.isReformaColchao { return "arrow.triangle.2.circlepath" }
        if product.isReformaBox { return "square.stack.3d.up.fill" }
        if product.isColchaoNovo { return "bed.double.fill" }
        if product.isCamaBox { return "shippingbox.fill" }
        if product.isPillowTop { return "sparkles" }
        return "tag.fill"
    }

    private var badgeColor: Color {
        if product.isReformaConjunto { return Color.purple }
        if product.isReformaColchao { return Color.purple }
        if product.isReformaBox { return Color.orange }
        if product.isColchaoNovo { return Color.blue }
        if product.isCamaBox { return Color.teal }
        if product.isPillowTop { return Color.emerald }
        return Color.secondary
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: NSNumber(value: value)) ?? "R$ \(value)"
    }
}
