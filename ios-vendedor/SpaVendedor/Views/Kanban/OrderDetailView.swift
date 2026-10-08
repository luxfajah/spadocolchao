import SwiftUI

public struct OrderDetailView: View {
    public let order: Order

    public init(order: Order) {
        self.order = order
    }

    public var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header com Status
                GlassCard(cornerRadius: 18) {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text(order.saleNumber)
                                .font(.title3.bold())
                                .foregroundStyle(.primary)

                            Spacer()

                            StatusBadge(title: order.status.title, icon: order.status.icon, color: order.status.color)
                        }

                        Divider()

                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("DATA DO PEDIDO")
                                    .font(.caption2.bold())
                                    .foregroundStyle(.secondary)
                                Text(order.formattedDate)
                                    .font(.subheadline)
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 2) {
                                Text("VALOR TOTAL")
                                    .font(.caption2.bold())
                                    .foregroundStyle(.secondary)
                                Text(formatCurrency(order.totalAmount))
                                    .font(.title3.bold())
                                    .foregroundStyle(Color.blue)
                            }
                        }
                    }
                }

                // Linha do Tempo de Produção
                GlassCard(cornerRadius: 18) {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("ETAPAS DE PRODUÇÃO")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)

                        VStack(spacing: 0) {
                            timelineStep(title: "Pedido Realizado", isDone: true, isCurrent: order.status == .sold)
                            timelineDivider(isDone: order.status != .sold)
                            timelineStep(title: "Ficha & Preparação", isDone: order.status != .sold, isCurrent: order.status == .waitingPreparation)
                            timelineDivider(isDone: order.status == .inProduction || order.status == .waitingDelivery || order.status == .delivered)
                            timelineStep(title: "Em Produção / Fábrica", isDone: order.status == .inProduction || order.status == .waitingDelivery || order.status == .delivered, isCurrent: order.status == .inProduction)
                            timelineDivider(isDone: order.status == .waitingDelivery || order.status == .delivered)
                            timelineStep(title: "Em Rota de Entrega", isDone: order.status == .waitingDelivery || order.status == .delivered, isCurrent: order.status == .waitingDelivery)
                            timelineDivider(isDone: order.status == .delivered)
                            timelineStep(title: "Entregue ao Cliente", isDone: order.status == .delivered, isCurrent: order.status == .delivered)
                        }
                    }
                }

                // Dados do Cliente
                GlassCard(cornerRadius: 18) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("DADOS DO CLIENTE")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(order.customerName)
                                .font(.headline)
                            if !order.customerPhone.isEmpty {
                                Text(order.customerPhone)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            if !order.customerAddress.isEmpty {
                                Text(order.customerAddress)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        HStack(spacing: 12) {
                            // Ligar
                            if let phoneClean = cleanPhone(order.customerPhone),
                               let url = URL(string: "tel://\(phoneClean)") {
                                Link(destination: url) {
                                    HStack {
                                        Image(systemName: "phone.fill")
                                        Text("Ligar")
                                    }
                                    .font(.subheadline.bold())
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color.blue.opacity(0.12))
                                    .foregroundStyle(.blue)
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                }
                            }

                            // WhatsApp
                            if let phoneClean = cleanPhone(order.customerPhone),
                               let url = URL(string: "https://api.whatsapp.com/send?phone=55\(phoneClean)") {
                                Link(destination: url) {
                                    HStack {
                                        Image(systemName: "message.fill")
                                        Text("WhatsApp")
                                    }
                                    .font(.subheadline.bold())
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color(red: 37/255, green: 211/255, blue: 102/255).opacity(0.15))
                                    .foregroundStyle(Color(red: 37/255, green: 211/255, blue: 102/255))
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                }
                            }
                        }
                        .padding(.top, 4)
                    }
                }

                // Itens do Pedido
                GlassCard(cornerRadius: 18) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("ITENS DO PEDIDO")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)

                        ForEach(order.items) { item in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.name)
                                        .font(.subheadline.bold())
                                    Text("\(item.quantity)x \(formatCurrency(item.unitPrice))")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(formatCurrency(item.total))
                                    .font(.subheadline.bold())
                                    .foregroundStyle(.primary)
                            }
                            if item.id != order.items.last?.id {
                                Divider()
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle(order.saleNumber)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func timelineStep(title: String, isDone: Bool, isCurrent: Bool) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(isDone ? (isCurrent ? Color.blue : Color.emerald) : Color.secondary.opacity(0.2))
                    .frame(width: 24, height: 24)

                if isDone {
                    Image(systemName: isCurrent ? "clock.fill" : "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                }
            }

            Text(title)
                .font(.subheadline.weight(isCurrent ? .bold : (isDone ? .medium : .regular)))
                .foregroundStyle(isDone ? Color.primary : Color.secondary)

            Spacer()

            if isCurrent {
                Text("Agora")
                    .font(.caption2.bold())
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.blue.opacity(0.12))
                    .foregroundStyle(.blue)
                    .clipShape(Capsule())
            }
        }
    }

    private func timelineDivider(isDone: Bool) -> some View {
        HStack {
            Rectangle()
                .fill(isDone ? Color.emerald.opacity(0.5) : Color.secondary.opacity(0.15))
                .frame(width: 2, height: 18)
                .padding(.leading, 11)
            Spacer()
        }
    }

    private func cleanPhone(_ raw: String) -> String? {
        let digits = raw.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        return digits.isEmpty ? nil : digits
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: NSNumber(value: value)) ?? "R$ \(value)"
    }
}
