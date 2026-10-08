import SwiftUI

public struct OrdersKanbanView: View {
    @Environment(AppState.self) private var appState

    @State private var selectedFilter: String = "Todos"
    @State private var searchText = ""

    private let filters = ["Todos", "Produção", "Em Rota", "Entregues"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        BrandHeader(
                            title: "Acompanhamento",
                            subtitle: "Fluxo de Produção & Entregas",
                            isOffline: appState.isOfflineMode,
                            isTestMode: appState.isTestMode
                        )
                        .padding(.horizontal)
                        .padding(.top, 8)

                        // Barra de Pesquisa
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundStyle(.secondary)
                            TextField("Buscar pedido ou cliente...", text: $searchText)
                                .textFieldStyle(PlainTextFieldStyle())
                        }
                        .padding(12)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .padding(.horizontal)

                        // Segmented Filter
                        Picker("Status", selection: $selectedFilter) {
                            ForEach(filters, id: \.self) { f in
                                Text(f).tag(f)
                            }
                        }
                        .pickerStyle(.segmented)
                        .padding(.horizontal)

                        // Lista de Pedidos
                        if filteredOrders.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "tray")
                                    .font(.system(size: 48))
                                    .foregroundStyle(.secondary)
                                Text("Nenhum pedido encontrado")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.top, 48)
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(filteredOrders) { order in
                                    NavigationLink(destination: OrderDetailView(order: order)) {
                                        orderCard(order: order)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.bottom, 24)
                }
                .refreshable {
                    await appState.loadData()
                }
            }
            .navigationBarHidden(true)
        }
    }

    private var filteredOrders: [Order] {
        appState.orders.filter { order in
            let matchesFilter: Bool = {
                switch selectedFilter {
                case "Produção":
                    return order.status == .inProduction || order.status == .waitingPreparation || order.status == .sold
                case "Em Rota":
                    return order.status == .waitingDelivery
                case "Entregues":
                    return order.status == .delivered || order.status == .finalized
                default:
                    return true
                }
            }()

            let matchesSearch = searchText.isEmpty ||
                order.saleNumber.localizedCaseInsensitiveContains(searchText) ||
                order.customerName.localizedCaseInsensitiveContains(searchText)

            return matchesFilter && matchesSearch
        }
    }

    private func orderCard(order: Order) -> some View {
        GlassCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(order.saleNumber)
                            .font(.headline)
                            .foregroundStyle(.primary)
                        Text(order.customerName)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }

                    Spacer()

                    StatusBadge(title: order.status.title, icon: order.status.icon, color: order.status.color)
                }

                Divider()

                HStack {
                    Text("\(order.items.count) item(s)")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Spacer()

                    Text(formatCurrency(order.totalAmount))
                        .font(.subheadline.bold())
                        .foregroundStyle(Color.blue)

                    Image(systemName: "chevron.right")
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
