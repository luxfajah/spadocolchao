import SwiftUI

public struct PDVView: View {
    @Environment(AppState.self) private var appState

    @State private var searchText = ""
    @State private var selectedCategory: String = "Todos"
    @State private var productToCustomize: Product? = nil
    @State private var showCartSheet = false
    @State private var showCustomerPicker = false

    private let categories = ["Todos", "Colchões Novos", "Reformas Colchão", "Reformas Box", "Acessórios"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        // Header com Saudação
                        BrandHeader(
                            title: "Catálogo & Vendas",
                            subtitle: "Olá, \(appState.currentUser?.name ?? "Vendedor")",
                            isOffline: appState.isOfflineMode
                        )
                        .padding(.horizontal)
                        .padding(.top, 8)

                        // Banner / Seletor de Cliente
                        Button(action: { showCustomerPicker = true }) {
                            HStack(spacing: 12) {
                                Image(systemName: "person.crop.circle.fill")
                                    .font(.title2)
                                    .foregroundStyle(appState.selectedCustomer == nil ? Color.secondary : Color.blue)

                                VStack(alignment: .leading, spacing: 2) {
                                    if let cust = appState.selectedCustomer {
                                        HStack(spacing: 6) {
                                            Text(cust.fullName)
                                                .font(.subheadline.bold())
                                                .foregroundStyle(.primary)
                                                .lineLimit(1)
                                            if cust.isCompany {
                                                Text("PJ")
                                                    .font(.system(size: 8, weight: .black))
                                                    .padding(.horizontal, 4)
                                                    .padding(.vertical, 1)
                                                    .background(Color.purple.opacity(0.12))
                                                    .foregroundStyle(.purple)
                                                    .clipShape(Capsule())
                                            }
                                        }
                                        Text(cust.phone ?? cust.formattedAddress)
                                            .font(.caption2)
                                            .foregroundStyle(.secondary)
                                            .lineLimit(1)
                                    } else {
                                        Text("Selecionar Cliente da Venda")
                                            .font(.subheadline.bold())
                                            .foregroundStyle(.primary)
                                        Text("\(appState.customers.count) clientes cadastrados • Toque para pesquisar")
                                            .font(.caption2)
                                            .foregroundStyle(.secondary)
                                    }
                                }

                                Spacer()

                                Text(appState.selectedCustomer == nil ? "Pesquisar" : "Alterar")
                                    .font(.caption.bold())
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Color.blue.opacity(0.12))
                                    .foregroundStyle(.blue)
                                    .clipShape(Capsule())
                            }
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .padding(.horizontal)
                        }

                        // Barra de Pesquisa
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundStyle(.secondary)
                            TextField("Buscar colchão, reforma, medida...", text: $searchText)
                                .textFieldStyle(PlainTextFieldStyle())
                            if !searchText.isEmpty {
                                Button(action: { searchText = "" }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .padding(12)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .padding(.horizontal)

                        // Filtros de Categoria (Horizontal Scroll)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(categories, id: \.self) { cat in
                                    Button(action: { selectedCategory = cat }) {
                                        Text(cat)
                                            .font(.subheadline.weight(selectedCategory == cat ? .bold : .medium))
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 8)
                                            .background(
                                                selectedCategory == cat
                                                ? Color.blue
                                                : Color.secondary.opacity(0.12)
                                            )
                                            .foregroundStyle(selectedCategory == cat ? Color.white : Color.primary)
                                            .clipShape(Capsule())
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }

                        // Lista / Grid de Produtos
                        if filteredProducts.isEmpty {
                            VStack(spacing: 12) {
                                if appState.isLoading {
                                    ProgressView()
                                        .padding()
                                } else {
                                    Image(systemName: "shippingbox")
                                        .font(.system(size: 44))
                                        .foregroundStyle(.secondary)
                                }
                                Text(appState.isLoading ? "Sincronizando com Supabase..." : "Nenhum produto encontrado no catálogo")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.top, 48)
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(filteredProducts) { product in
                                    ProductCardView(product: product) {
                                        if product.isColchao || product.isReforma || product.isBox {
                                            productToCustomize = product
                                        } else {
                                            appState.addToCart(product: product)
                                        }
                                    }
                                }
                            }
                            .padding(.horizontal)
                            .padding(.bottom, appState.cartItemCount > 0 ? 90 : 20)
                        }
                    }
                }
                .refreshable {
                    await appState.loadData()
                }

                // Botão Flutuante de Carrinho
                if appState.cartItemCount > 0 {
                    floatingCartBar
                        .padding(.horizontal, 16)
                        .padding(.bottom, 12)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .navigationBarHidden(true)
            .sheet(item: $productToCustomize) { product in
                ProductCustomizerSheet(product: product) { options, qty in
                    appState.addToCart(product: product, customization: options, quantity: qty)
                }
            }
            .sheet(isPresented: $showCartSheet) {
                CartView()
            }
            .sheet(isPresented: $showCustomerPicker) {
                CustomerPickerSheet { selectedCustomer in
                    appState.selectedCustomer = selectedCustomer
                }
            }
        }
    }

    // MARK: - Filtro de Produtos
    private var filteredProducts: [Product] {
        appState.products.filter { prod in
            let matchesCategory: Bool = {
                switch selectedCategory {
                case "Colchões Novos": return prod.isColchao && !prod.isReforma
                case "Reformas Colchão": return prod.isReforma && prod.isColchao
                case "Reformas Box": return prod.isBox
                case "Acessórios": return !prod.isColchao && !prod.isReforma && !prod.isBox
                default: return true
                }
            }()

            let matchesSearch = searchText.isEmpty ||
                prod.name.localizedCaseInsensitiveContains(searchText) ||
                (prod.description ?? "").localizedCaseInsensitiveContains(searchText)

            return matchesCategory && matchesSearch
        }
    }

    // MARK: - Floating Cart Bar
    private var floatingCartBar: some View {
        Button(action: { showCartSheet = true }) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.25))
                        .frame(width: 36, height: 36)
                    Text("\(appState.cartItemCount)")
                        .font(.headline.bold())
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("Ver Carrinho")
                        .font(.headline.bold())
                        .foregroundStyle(.white)
                    Text(formatCurrency(appState.cartTotal))
                        .font(.subheadline)
                        .foregroundStyle(Color.white.opacity(0.85))
                }

                Spacer()

                HStack(spacing: 4) {
                    Text("Avançar")
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                    Image(systemName: "chevron.right")
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(
                LinearGradient(
                    colors: [Color.blue, Color(red: 29/255, green: 78/255, blue: 216/255)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .shadow(color: Color.blue.opacity(0.4), radius: 12, x: 0, y: 6)
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: NSNumber(value: value)) ?? "R$ \(value)"
    }
}
