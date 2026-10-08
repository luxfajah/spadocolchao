import SwiftUI

public struct MainTabView: View {
    @Environment(AppState.self) private var appState
    @State private var selectedTab = 0

    public init() {}

    public var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: PDV / Catálogo
            PDVView()
                .tabItem {
                    Label("Vender", systemImage: "bag.fill")
                }
                .badge(appState.cartItemCount > 0 ? "\(appState.cartItemCount)" : nil)
                .tag(0)

            // Tab 2: Kanban / Acompanhamento de Pedidos
            OrdersKanbanView()
                .tabItem {
                    Label("Pedidos", systemImage: "shippingbox.fill")
                }
                .tag(1)

            // Tab 3: Metas & Performance
            GoalsView()
                .tabItem {
                    Label("Metas", systemImage: "chart.line.uptrend.xyaxis")
                }
                .tag(2)

            // Tab 4: Visitas & Rotas Externas
            VisitsView()
                .tabItem {
                    Label("Visitas", systemImage: "map.fill")
                }
                .tag(3)

            // Tab 5: Perfil
            ProfileView()
                .tabItem {
                    Label("Perfil", systemImage: "person.crop.circle.fill")
                }
                .tag(4)
        }
        .tint(Color.blue)
        .task {
            await appState.loadData()
        }
    }
}
