import SwiftUI

public struct SaleSuccessSheet: View {
    public let saleNumber: String
    public let customerName: String
    public let totalAmount: Double
    public let estimatedCommission: Double
    public let onDismiss: () -> Void

    public init(
        saleNumber: String,
        customerName: String,
        totalAmount: Double,
        estimatedCommission: Double,
        onDismiss: @escaping () -> Void
    ) {
        self.saleNumber = saleNumber
        self.customerName = customerName
        self.totalAmount = totalAmount
        self.estimatedCommission = estimatedCommission
        self.onDismiss = onDismiss
    }

    public var body: some View {
        ZStack {
            Color(uiColor: .systemBackground)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                // Sucesso com Animação
                ZStack {
                    Circle()
                        .fill(Color.emerald.opacity(0.15))
                        .frame(width: 100, height: 100)

                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 68))
                        .foregroundStyle(Color.emerald)
                }

                VStack(spacing: 8) {
                    Text("Venda Confirmada!")
                        .font(.system(size: 26, weight: .bold, design: .rounded))

                    Text("Pedido enviado para a linha de produção")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                // Card Resumo
                GlassCard(cornerRadius: 20) {
                    VStack(spacing: 12) {
                        HStack {
                            Text("Número do Pedido")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(saleNumber)
                                .font(.headline.bold())
                                .foregroundStyle(.primary)
                        }

                        HStack {
                            Text("Cliente")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(customerName)
                                .font(.subheadline.weight(.medium))
                        }

                        Divider()

                        HStack {
                            Text("Valor Total")
                                .font(.headline)
                            Spacer()
                            Text(formatCurrency(totalAmount))
                                .font(.title3.bold())
                                .foregroundStyle(Color.blue)
                        }

                        // Badge de Comissão
                        HStack {
                            Image(systemName: "sparkles")
                                .foregroundStyle(Color.emerald)
                            Text("Sua Comissão Estimada:")
                                .font(.caption.bold())
                                .foregroundStyle(Color.emerald)
                            Spacer()
                            Text(formatCurrency(estimatedCommission))
                                .font(.headline.bold())
                                .foregroundStyle(Color.emerald)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.emerald.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
                .padding(.horizontal, 24)

                Spacer()

                // Ações
                VStack(spacing: 12) {
                    // Botão WhatsApp
                    Button(action: shareViaWhatsApp) {
                        HStack(spacing: 8) {
                            Image(systemName: "message.fill")
                            Text("Enviar Comprovante no WhatsApp")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Color(red: 37/255, green: 211/255, blue: 102/255)) // WhatsApp Green
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }

                    // Botão Fechar
                    Button(action: onDismiss) {
                        Text("Nova Venda")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(Color.blue)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
    }

    private func shareViaWhatsApp() {
        let text = """
        *Spa do Colchão - Comprovante de Pedido* 🛏️
        Pedido: *\(saleNumber)*
        Cliente: \(customerName)
        Valor Total: \(formatCurrency(totalAmount))
        Status: Confirmado e em Produção!
        
        Obrigado pela preferência!
        """
        if let encoded = text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
           let url = URL(string: "https://api.whatsapp.com/send?text=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: NSNumber(value: value)) ?? "R$ \(value)"
    }
}
