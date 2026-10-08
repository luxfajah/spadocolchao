import SwiftUI

public struct GoalsView: View {
    @Environment(AppState.self) private var appState

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        BrandHeader(
                            title: "Metas & Performance",
                            subtitle: "Resultados Comerciais do Mês",
                            isOffline: appState.isOfflineMode
                        )
                        .padding(.horizontal)
                        .padding(.top, 8)

                        // Card Circular da Meta Principal
                        mainGoalCard

                        // Grid de Métricas Secundárias
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                            MetricCard(
                                title: "VENDAS HOJE",
                                value: formatCurrency(appState.goalStats.todayTotal),
                                subtitle: "Lançadas hoje",
                                icon: "calendar.badge.clock",
                                iconColor: .blue
                            )

                            MetricCard(
                                title: "TICKET MÉDIO",
                                value: formatCurrency(appState.goalStats.ticketMedio),
                                subtitle: "\(appState.goalStats.monthSalesCount) vendas fechadas",
                                icon: "chart.line.uptrend.xyaxis",
                                iconColor: .indigo
                            )

                            MetricCard(
                                title: "COMISSÃO DO MÊS",
                                value: formatCurrency(appState.goalStats.commissionEstimated),
                                subtitle: "5% sobre vendas",
                                icon: "banknote.fill",
                                iconColor: Color.emerald
                            )

                            MetricCard(
                                title: "PEDIDOS TOTAIS",
                                value: "\(appState.goalStats.monthSalesCount)",
                                subtitle: "No mês vigente",
                                icon: "shippingbox.fill",
                                iconColor: .purple
                            )
                        }
                        .padding(.horizontal)

                        // Destaque de Motivação
                        motivationalCard
                            .padding(.horizontal)
                            .padding(.bottom, 24)
                    }
                }
                .refreshable {
                    await appState.loadData()
                }
            }
            .navigationBarHidden(true)
        }
    }

    private var mainGoalCard: some View {
        GlassCard(cornerRadius: 24) {
            VStack(spacing: 18) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("META MENSAL")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)
                        Text(formatCurrency(appState.goalStats.targetAmount))
                            .font(.title2.bold())
                    }
                    Spacer()
                    ZStack {
                        Circle()
                            .fill(Color.blue.opacity(0.12))
                            .frame(width: 44, height: 44)
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Color.blue)
                    }
                }

                // Anel de Progresso
                ZStack {
                    Circle()
                        .stroke(Color.secondary.opacity(0.15), lineWidth: 16)
                        .frame(width: 170, height: 170)

                    Circle()
                        .trim(from: 0, to: min(1.0, CGFloat(appState.goalStats.progressPercent) / 100.0))
                        .stroke(
                            LinearGradient(
                                colors: [Color.blue, Color.emerald],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 16, lineCap: .round)
                        )
                        .frame(width: 170, height: 170)
                        .rotationEffect(.degrees(-90))
                        .animation(.spring(response: 0.8, dampingFraction: 0.7), value: appState.goalStats.progressPercent)

                    VStack(spacing: 2) {
                        Text("\(appState.goalStats.progressPercent)%")
                            .font(.system(size: 38, weight: .bold, design: .rounded))
                            .foregroundStyle(.primary)

                        Text("atingido")
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 8)

                Divider()

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("REALIZADO NO MÊS")
                            .font(.caption2.bold())
                            .foregroundStyle(.secondary)
                        Text(formatCurrency(appState.goalStats.monthTotal))
                            .font(.headline.bold())
                            .foregroundStyle(Color.blue)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("RESTANTE")
                            .font(.caption2.bold())
                            .foregroundStyle(.secondary)
                        let remaining = max(0.0, appState.goalStats.targetAmount - appState.goalStats.monthTotal)
                        Text(formatCurrency(remaining))
                            .font(.headline.bold())
                            .foregroundStyle(Color.secondary)
                    }
                }
            }
        }
        .padding(.horizontal)
    }

    private var motivationalCard: some View {
        GlassCard(cornerRadius: 18) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(Color.amber.opacity(0.2))
                        .frame(width: 44, height: 44)
                    Image(systemName: "sparkles")
                        .font(.title3)
                        .foregroundStyle(Color.amber)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text("Acelere suas Vendas!")
                        .font(.subheadline.bold())
                    let remaining = max(0.0, appState.goalStats.targetAmount - appState.goalStats.monthTotal)
                    Text("Faltam \(formatCurrency(remaining)) para você bater 100% da meta e destravar o bônus especial.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: NSNumber(value: value)) ?? "R$ \(value)"
    }
}
