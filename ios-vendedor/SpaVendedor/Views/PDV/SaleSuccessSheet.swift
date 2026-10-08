import SwiftUI

public struct SaleSuccessSheet: View {
    public let saleNumber: String
    public let customerName: String
    public let totalAmount: Double
    public let estimatedCommission: Double
    public let downPaymentAmount: Double
    public let downPaymentMethod: String
    public let remainingBalance: Double
    public let deliveryPaymentMethod: String
    public let onDismiss: () -> Void

    public init(
        saleNumber: String,
        customerName: String,
        totalAmount: Double,
        estimatedCommission: Double,
        downPaymentAmount: Double = 0.0,
        downPaymentMethod: String = "",
        remainingBalance: Double = 0.0,
        deliveryPaymentMethod: String = "",
        onDismiss: @escaping () -> Void
    ) {
        self.saleNumber = saleNumber
        self.customerName = customerName
        self.totalAmount = totalAmount
        self.estimatedCommission = estimatedCommission
        self.downPaymentAmount = downPaymentAmount
        self.downPaymentMethod = downPaymentMethod
        self.remainingBalance = remainingBalance
        self.deliveryPaymentMethod = deliveryPaymentMethod
        self.onDismiss = onDismiss
    }

    public var body: some View {
        ZStack {
            Color(uiColor: .systemBackground)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                Spacer()

                // Sucesso com Animação
                ZStack {
                    Circle()
                        .fill(Color.emerald.opacity(0.15))
                        .frame(width: 90, height: 90)

                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(Color.emerald)
                }

                VStack(spacing: 6) {
                    Text("Venda Confirmada!")
                        .font(.system(size: 24, weight: .bold, design: .rounded))

                    Text("Pedido registrado e enviado para produção")
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

                        // Seção de Entrada Paga no Ato e Saldo na Entrega
                        if downPaymentAmount > 0 {
                            VStack(spacing: 6) {
                                HStack {
                                    HStack(spacing: 4) {
                                        Image(systemName: "checkmark.seal.fill")
                                            .foregroundStyle(Color.emerald)
                                        Text("Entrada Paga no Ato:")
                                            .font(.caption.bold())
                                            .foregroundStyle(Color.secondary)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 1) {
                                        Text(formatCurrency(downPaymentAmount))
                                            .font(.caption.bold())
                                            .foregroundStyle(Color.emerald)
                                        if !downPaymentMethod.isEmpty {
                                            Text("via \(downPaymentMethod)")
                                                .font(.system(size: 9))
                                                .foregroundStyle(Color.secondary)
                                        }
                                    }
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.emerald.opacity(0.08))
                                .clipShape(RoundedRectangle(cornerRadius: 8))

                                HStack {
                                    HStack(spacing: 4) {
                                        Image(systemName: "truck.box.badge.clock.fill")
                                            .foregroundStyle(Color.blue)
                                        Text("Saldo na Entrega:")
                                            .font(.caption.bold())
                                            .foregroundStyle(Color.secondary)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 1) {
                                        Text(formatCurrency(remainingBalance > 0 ? remainingBalance : max(0.0, totalAmount - downPaymentAmount)))
                                            .font(.caption.bold())
                                            .foregroundStyle(Color.blue)
                                        if !deliveryPaymentMethod.isEmpty {
                                            Text("a receber via \(deliveryPaymentMethod)")
                                                .font(.system(size: 9).bold())
                                                .foregroundStyle(Color.blue)
                                        }
                                    }
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.blue.opacity(0.08))
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
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
                        .background(Color(red: 37/255, green: 211/255, blue: 102/255))
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
        var financeText = ""
        if downPaymentAmount > 0 {
            let saldo = remainingBalance > 0 ? remainingBalance : max(0.0, totalAmount - downPaymentAmount)
            financeText = """
            
            *Condição de Pagamento:*
            ✅ Entrada Paga no Ato: \(formatCurrency(downPaymentAmount)) (\(downPaymentMethod))
            🚚 Saldo Restante na Entrega: \(formatCurrency(saldo))
            """
        }

        let text = """
        *Spa do Colchão - Comprovante de Pedido* 🛏️
        Pedido: *\(saleNumber)*
        Cliente: \(customerName)
        Valor Total: \(formatCurrency(totalAmount))\(financeText)
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
