import Foundation
import SwiftUI
import Observation

@Observable
public final class AppState {
    public var currentUser: User? = nil
    public var isAuthenticated: Bool = false

    // PDV / Catálogo
    public var products: [Product] = Product.sampleProducts
    public var customers: [Customer] = Customer.sampleCustomers
    public var selectedCustomer: Customer? = nil

    // Carrinho Ativo
    public var cartItems: [CartItem] = []
    public var globalDiscount: Double = 0.0

    // Kanban e Pedidos
    public var orders: [Order] = Order.sampleOrders

    // Metas & Saldo
    public var goalStats: GoalStats = GoalStats.sample

    // Visitas
    public var visits: [Visit] = Visit.sampleVisits

    // Estado Operacional
    public var isLoading: Bool = false
    public var errorMessage: String? = nil
    public var isOfflineMode: Bool = false

    public init() {
        // Inicializa com dados demo ou sessão salva
        if let savedUser = loadSavedUser() {
            self.currentUser = savedUser
            self.isAuthenticated = true
        }
    }

    // MARK: - Cálculos do Carrinho
    public var cartItemCount: Int {
        cartItems.reduce(0) { $0 + $1.quantity }
    }

    public var cartSubtotal: Double {
        cartItems.reduce(0) { $0 + $1.totalAmount }
    }

    public var cartTotal: Double {
        max(0.0, cartSubtotal - globalDiscount)
    }

    public var estimatedCommission: Double {
        let rate = currentUser?.commissionRate ?? 0.05
        return cartTotal * rate
    }

    public func addToCart(product: Product, customization: CustomizationOptions = CustomizationOptions(), quantity: Int = 1) {
        let price = product.defaultPrice + customization.extraPrice
        let item = CartItem(
            product: product,
            quantity: quantity,
            unitPrice: price,
            customization: customization
        )
        cartItems.append(item)
    }

    public func removeFromCart(id: UUID) {
        cartItems.removeAll { $0.id == id }
    }

    public func clearCart() {
        cartItems.removeAll()
        globalDiscount = 0.0
        selectedCustomer = nil
    }

    // MARK: - Ações de Dados
    @MainActor
    public func loadData() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let (fetchedProducts, fetchedCustomers) = try await APIClient.shared.fetchPDVInit()
            if !fetchedProducts.isEmpty {
                self.products = fetchedProducts
            }
            if !fetchedCustomers.isEmpty {
                self.customers = fetchedCustomers
            }

            let fetchedOrders = try await APIClient.shared.fetchOrders(sellerId: currentUser?.sellerId)
            if !fetchedOrders.isEmpty {
                self.orders = fetchedOrders
            }

            let fetchedStats = try await APIClient.shared.fetchGoalStats(sellerId: currentUser?.sellerId)
            self.goalStats = fetchedStats

            self.isOfflineMode = false
        } catch {
            // Em caso de falha de conexão, opera em modo offline suavemente
            self.isOfflineMode = true
        }
    }

    // MARK: - Autenticação
    public func setUser(_ user: User) {
        self.currentUser = user
        self.isAuthenticated = true
        saveUser(user)
    }

    public func logout() {
        self.currentUser = nil
        self.isAuthenticated = false
        clearCart()
        UserDefaults.standard.removeObject(forKey: "saved_logged_user")
    }

    private func saveUser(_ user: User) {
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: "saved_logged_user")
        }
    }

    private func loadSavedUser() -> User? {
        guard let data = UserDefaults.standard.data(forKey: "saved_logged_user"),
              let user = try? JSONDecoder().decode(User.self, from: data) else {
            return nil
        }
        return user
    }
}
