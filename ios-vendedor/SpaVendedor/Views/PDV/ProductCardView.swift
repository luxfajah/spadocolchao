import SwiftUI

public struct ProductCardView: View {
    public let product: Product
    public let onSelect: () -> Void

    public init(product: Product, onSelect: @escaping () -> Void) {
        self.product = product
        self.onSelect = onSelect
    }

    public var body: some View {
        Button(action: onSelect) {
            GlassCard(cornerRadius: 18) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .top) {
                        ZStack {
                            Circle()
                                .fill(badgeColor.opacity(0.15))
                                .frame(width: 44, height: 44)
                            Image(systemName: iconName)
                                .font(.system(size: 20))
                                .foregroundStyle(badgeColor)
                        }

                        Spacer()

                        if product.isReforma {
                            StatusBadge(title: "Reforma", icon: "arrow.triangle.2.circlepath", color: .purple)
                        } else if product.isColchao {
                            StatusBadge(title: "Novo", icon: "sparkles", color: .blue)
                        } else {
                            StatusBadge(title: "Acessório", icon: "tag", color: .teal)
                        }
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(product.name)
                            .font(.headline)
                            .foregroundStyle(.primary)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)

                        if let desc = product.description {
                            Text(desc)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                                .multilineTextAlignment(.leading)
                        }
                    }

                    Divider()

                    HStack(alignment: .bottom) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("A PARTIR DE")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(.secondary)
                            Text(formatCurrency(product.defaultPrice))
                                .font(.title3.bold())
                                .foregroundStyle(Color.blue)
                        }

                        Spacer()

                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundStyle(Color.blue)
                    }
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var iconName: String {
        if product.isReforma { return "arrow.triangle.2.circlepath" }
        if product.isColchao { return "bed.double.fill" }
        if product.isBox { return "square.stack.3d.up.fill" }
        return "bag.fill"
    }

    private var badgeColor: Color {
        if product.isReforma { return .purple }
        if product.isColchao { return .blue }
        return .teal
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: NSNumber(value: value)) ?? "R$ \(value)"
    }
}
