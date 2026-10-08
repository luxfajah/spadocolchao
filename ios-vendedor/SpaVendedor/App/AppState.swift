import Foundation
import SwiftUI
import Observation

@Observable
public final class AppState {
    public var currentUser: User? = nil
    public var isAuthenticated: Bool = false

    // PDV / Catálogo
    public var products: [Product] = []
    public var customers: [Customer] = []
    public var selectedCustomer: Customer? = nil

    // Carrinho Ativo
    public var cartItems: [CartItem] = []
    public var globalDiscount: Double = 0.0
    public var freightAmount: Double = 0.0

    // Kanban e Pedidos
    public var orders: [Order] = []

    // Metas & Saldo
    public var goalStats: GoalStats = GoalStats()

    // Visitas
    public var visits: [Visit] = []

    // Estado Operacional
    public var isLoading: Bool = false
    public var errorMessage: String? = nil
    public var isOfflineMode: Bool = false
    public var isTestMode: Bool = true

    public init() {
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
        max(0.0, cartSubtotal - globalDiscount + freightAmount)
    }

    // A comissão incide exclusivamente sobre o valor dos produtos/serviços com desconto, NUNCA sobre o frete!
    public var commissionableAmount: Double {
        max(0.0, cartSubtotal - globalDiscount)
    }

    public var commissionPercent: Double {
        currentUser?.commissionPercent ?? 5.0
    }

    public var commissionPercentText: String {
        let pct = commissionPercent
        if pct.truncatingRemainder(dividingBy: 1) == 0 {
            return "\(Int(pct))%"
        } else {
            return String(format: "%.1f%%", pct)
        }
    }

    public var estimatedCommission: Double {
        commissionableAmount * (commissionPercent / 100.0)
    }

    public func addToCart(
        product: Product,
        customization: CustomizationOptions = CustomizationOptions(),
        quantity: Int = 1,
        negotiatedUnitPrice: Double? = nil,
        priceJustification: String? = nil
    ) {
        let officialPrice = product.defaultPrice + customization.extraPrice
        let item = CartItem(
            product: product,
            quantity: quantity,
            originalPrice: officialPrice,
            unitPrice: negotiatedUnitPrice ?? officialPrice,
            priceJustification: priceJustification,
            customization: customization
        )
        cartItems.append(item)
    }

    public func updateItemPrice(id: UUID, newPrice: Double, justification: String? = nil) {
        if let idx = cartItems.firstIndex(where: { $0.id == id }) {
            cartItems[idx].unitPrice = max(0.0, newPrice)
            if let just = justification {
                cartItems[idx].priceJustification = just.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
    }

    public func updateItemQuantity(id: UUID, newQuantity: Int) {
        if let idx = cartItems.firstIndex(where: { $0.id == id }) {
            if newQuantity <= 0 {
                cartItems.remove(at: idx)
            } else {
                cartItems[idx].quantity = newQuantity
            }
        }
    }

    public func removeFromCart(id: UUID) {
        cartItems.removeAll { $0.id == id }
    }

    public func itemQuantity(for product: Product) -> Int {
        cartItems.filter { $0.product.id == product.id }.reduce(0) { $0 + $1.quantity }
    }

    public func updateQuantity(for product: Product, delta: Int) {
        if let idx = cartItems.firstIndex(where: { $0.product.id == product.id }) {
            let newQty = cartItems[idx].quantity + delta
            if newQty <= 0 {
                cartItems.remove(at: idx)
            } else {
                cartItems[idx].quantity = newQty
            }
        } else if delta > 0 {
            addToCart(product: product, quantity: delta)
        }
    }

    public func clearCart() {
        cartItems.removeAll()
        globalDiscount = 0.0
        freightAmount = 0.0
        selectedCustomer = nil
    }

    // MARK: - Ações de Dados
    @MainActor
    public func loadData() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let pdvTask = APIClient.shared.fetchPDVInit()
            let isAdmin = currentUser?.isAdmin == true
            async let ordersTask = APIClient.shared.fetchOrders(sellerId: currentUser?.sellerId, isAdmin: isAdmin, testMode: isTestMode)
            async let statsTask = APIClient.shared.fetchGoalStats(sellerId: currentUser?.sellerId)
            async let visitsTask = APIClient.shared.fetchVisits(sellerId: currentUser?.sellerId)

            let ((fetchedProducts, fetchedCustomers), fetchedOrders, fetchedStats, fetchedVisits) = try await (pdvTask, ordersTask, statsTask, visitsTask)

            self.products = fetchedProducts
            self.customers = fetchedCustomers
            self.orders = fetchedOrders
            self.goalStats = fetchedStats
            self.visits = fetchedVisits
            self.isOfflineMode = false
        } catch {
            self.isOfflineMode = true
            self.errorMessage = "Falha ao sincronizar com Supabase: \(error.localizedDescription)"
        }
    }

    @MainActor
    public func createVisit(newVisit: Visit) async {
        do {
            let created = try await APIClient.shared.createVisit(
                sellerId: currentUser?.sellerId,
                clientName: newVisit.clientName,
                clientPhone: newVisit.clientPhone,
                clientAddress: newVisit.clientAddress,
                visitDate: newVisit.visitDate,
                notes: newVisit.notes
            )
            self.visits.insert(created, at: 0)
        } catch {
            self.visits.insert(newVisit, at: 0)
        }
    }

    @MainActor
    public func clearTestSales() async -> Int {
        do {
            let count = try await APIClient.shared.clearTestOrders()
            await loadData()
            return count
        } catch {
            return 0
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

    public func loadSavedUser() -> User? {
        guard let data = UserDefaults.standard.data(forKey: "saved_logged_user") else {
            return nil
        }
        do {
            return try JSONDecoder().decode(User.self, from: data)
        } catch {
            UserDefaults.standard.removeObject(forKey: "saved_logged_user")
            return nil
        }
    }
}
