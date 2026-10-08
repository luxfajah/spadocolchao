import SwiftUI

public struct PDVView: View {
    @Environment(AppState.self) private var appState

    @State private var searchText = ""
    @State private var selectedCategory: String = "Todos"
    @State private var selectedSize: String = "Todas as Medidas"
    @State private var productToCustomize: Product? = nil
    @State private var showCartSheet = false
    @State private var showCustomerPicker = false

    private let categories = [
        "Todos",
        "Reformas Colchão",
        "Reformas Box",
        "Reformas Conjunto",
        "Colchões Novos",
        "Camas Box",
        "Pillow Top & Acessórios"
    ]

    private let sizeFilters = [
        "Todas as Medidas",
        "Solteiro",
        "Casal",
        "Queen",
        "King"
    ]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 14) {
                        // Header com Saudação
                        BrandHeader(
                            title: "Catálogo de Produtos",
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
                                                .foregroundStyle(Color.primary)
                                                .lineLimit(1)
                                            if cust.isCompany {
                                                Text("PJ")
                                                    .font(.system(size: 8, weight: .black))
                                                    .padding(.horizontal, 4)
                                                    .padding(.vertical, 1)
                                                    .background(Color.purple.opacity(0.12))
                                                    .foregroundStyle(Color.purple)
                                                    .clipShape(Capsule())
                                            }
                                        }
                                        Text(cust.phone ?? cust.formattedAddress)
                                            .font(.caption2)
                                            .foregroundStyle(Color.secondary)
                                            .lineLimit(1)
                                    } else {
                                        Text("Selecionar Cliente da Venda")
                                            .font(.subheadline.bold())
                                            .foregroundStyle(Color.primary)
                                        Text("\(appState.customers.count) clientes cadastrados • Toque para selecionar")
                                            .font(.caption2)
                                            .foregroundStyle(Color.secondary)
                                    }
                                }

                                Spacer()

                                Text(appState.selectedCustomer == nil ? "Pesquisar" : "Alterar")
                                    .font(.caption.bold())
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Color.blue.opacity(0.12))
                                    .foregroundStyle(Color.blue)
                                    .clipShape(Capsule())
                            }
                            .padding(12)
                            .background(Color(uiColor: .secondarySystemGroupedBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .padding(.horizontal)
                        }

                        // Barra de Pesquisa Rápida
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundStyle(Color.secondary)
                            TextField("Buscar colchão, reforma, box, medida...", text: $searchText)
                                .textFieldStyle(PlainTextFieldStyle())
                            if !searchText.isEmpty {
                                Button(action: { searchText = "" }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(Color.secondary)
                                }
                            }
                        }
                        .padding(12)
                        .background(Color(uiColor: .secondarySystemGroupedBackground))
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
                                                : Color(uiColor: .tertiarySystemFill)
                                            )
                                            .foregroundStyle(selectedCategory == cat ? Color.white : Color.primary)
                                            .clipShape(Capsule())
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }

                        // Filtros Rápidos de Tamanho (Solteiro, Casal, Queen, King)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(sizeFilters, id: \.self) { sz in
                                    Button(action: { selectedSize = sz }) {
                                        HStack(spacing: 4) {
                                            if sz != "Todas as Medidas" {
                                                Image(systemName: "ruler")
                                                    .font(.system(size: 10))
                                            }
                                            Text(sz)
                                                .font(.caption.bold())
                                        }
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(
                                            selectedSize == sz
                                            ? Color.purple
                                            : Color(uiColor: .tertiarySystemFill).opacity(0.8)
                                        )
                                        .foregroundStyle(selectedSize == sz ? Color.white : Color.secondary)
                                        .clipShape(Capsule())
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }

                        // Contagem e Reset de Filtros
                        HStack {
                            Text("\(filteredProducts.count) item(ns) encontrado(s)")
                                .font(.caption2.bold())
                                .foregroundStyle(Color.secondary)
                            Spacer()
                            if selectedCategory != "Todos" || selectedSize != "Todas as Medidas" || !searchText.isEmpty {
                                Button("Limpar Filtros") {
                                    selectedCategory = "Todos"
                                    selectedSize = "Todas as Medidas"
                                    searchText = ""
                                }
                                .font(.caption2.bold())
                                .foregroundStyle(Color.blue)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 2)

                        // Lista / Cards de Produtos
                        if filteredProducts.isEmpty {
                            VStack(spacing: 12) {
                                if appState.isLoading {
                                    ProgressView()
                                        .padding()
                                } else {
                                    Image(systemName: "shippingbox")
                                        .font(.system(size: 44))
                                        .foregroundStyle(Color.secondary)
                                }
                                Text(appState.isLoading ? "Sincronizando com Supabase..." : "Nenhum produto encontrado")
                                    .font(.subheadline)
                                    .foregroundStyle(Color.secondary)
                                if selectedCategory != "Todos" || selectedSize != "Todas as Medidas" || !searchText.isEmpty {
                                    Button("Mostrar Todos os Produtos") {
                                        selectedCategory = "Todos"
                                        selectedSize = "Todas as Medidas"
                                        searchText = ""
                                    }
                                    .buttonStyle(.bordered)
                                    .padding(.top, 4)
                                }
                            }
                            .padding(.top, 48)
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(filteredProducts) { product in
                                    ProductCardView(product: product) {
                                        productToCustomize = product
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
                ProductCustomizerSheet(product: product) { options, qty, negotiatedPrice, justification in
                    appState.addToCart(
                        product: product,
                        customization: options,
                        quantity: qty,
                        negotiatedUnitPrice: negotiatedPrice,
                        priceJustification: justification
                    )
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

    // MARK: - Filtro de Produtos Inteligente
    private var filteredProducts: [Product] {
        appState.products.filter { prod in
            let matchesCategory: Bool = {
                switch selectedCategory {
                case "Reformas Colchão": return prod.isReformaColchao
                case "Reformas Box": return prod.isReformaBox
                case "Reformas Conjunto": return prod.isReformaConjunto
                case "Colchões Novos": return prod.isColchaoNovo
                case "Camas Box": return prod.isCamaBox
                case "Pillow Top & Acessórios": return prod.isPillowTop || (!prod.isColchao && !prod.isReforma && !prod.isBox)
                default: return true
                }
            }()

            let matchesSize: Bool = {
                if selectedSize == "Todas as Medidas" { return true }
                return prod.detectedSize == selectedSize
            }()

            let matchesSearch = searchText.isEmpty ||
                prod.name.localizedCaseInsensitiveContains(searchText) ||
                (prod.description ?? "").localizedCaseInsensitiveContains(searchText)

            return matchesCategory && matchesSize && matchesSearch
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
                        .foregroundStyle(Color.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("Ver Carrinho")
                        .font(.headline.bold())
                        .foregroundStyle(Color.white)
                    Text(formatCurrency(appState.cartTotal))
                        .font(.subheadline)
                        .foregroundStyle(Color.white.opacity(0.85))
                }

                Spacer()

                HStack(spacing: 4) {
                    Text("Finalizar Compra")
                        .font(.subheadline.bold())
                        .foregroundStyle(Color.white)
                    Image(systemName: "chevron.right")
                        .font(.caption.bold())
                        .foregroundStyle(Color.white)
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
