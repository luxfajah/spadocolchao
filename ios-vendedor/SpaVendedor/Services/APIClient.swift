import Foundation

public final class APIClient: Sendable {
    public static let shared = APIClient()

    // URL de produção na Vercel (pode ser alternada para localhost ou IP de desenvolvimento)
    public var baseURLString: String {
        get {
            UserDefaults.standard.string(forKey: "custom_api_base_url") ?? "https://spadocolchao.vercel.app"
        }
        set {
            UserDefaults.standard.set(newValue, forKey: "custom_api_base_url")
        }
    }

    private init() {}

    private var jsonDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }

    // MARK: - Autenticação
    public func login(username: String, password: String) async throws -> User {
        let endpoint = "\(baseURLString)/api/vendedor/auth"
        guard let url = URL(string: endpoint) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 12.0

        let body = ["username": username, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        guard httpResponse.statusCode == 200 else {
            if let errObj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let message = errObj["error"] as? String {
                throw NSError(domain: "AuthError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: message])
            }
            throw URLError(.userAuthenticationRequired)
        }

        let authResp = try jsonDecoder.decode(AuthResponse.self, from: data)
        guard let user = authResp.user else {
            throw NSError(domain: "AuthError", code: 400, userInfo: [NSLocalizedDescriptionKey: "Usuário não retornado pelo servidor"])
        }
        return user
    }

    // MARK: - Catálogo e PDV Init
    public func fetchPDVInit() async throws -> ([Product], [Customer]) {
        let endpoint = "\(baseURLString)/api/vendedor/pdv/init"
        guard let url = URL(string: endpoint) else {
            return (Product.sampleProducts, Customer.sampleCustomers)
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 10.0

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return (Product.sampleProducts, Customer.sampleCustomers)
            }

            struct PDVInitResponse: Codable {
                let success: Bool
                let products: [Product]
                let customers: [Customer]
            }

            let res = try jsonDecoder.decode(PDVInitResponse.self, from: data)
            return (res.products, res.customers)
        } catch {
            // Fallback transparente para o modo offline/demonstração
            return (Product.sampleProducts, Customer.sampleCustomers)
        }
    }

    // MARK: - Pedidos / Kanban
    public func fetchOrders(sellerId: String?) async throws -> [Order] {
        var components = URLComponents(string: "\(baseURLString)/api/vendedor/pedidos")
        if let sId = sellerId {
            components?.queryItems = [URLQueryItem(name: "sellerId", value: sId)]
        }

        guard let url = components?.url else {
            return Order.sampleOrders
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 10.0

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return Order.sampleOrders
            }

            struct OrdersResponse: Codable {
                let success: Bool
                let orders: [Order]
            }

            let res = try jsonDecoder.decode(OrdersResponse.self, from: data)
            return res.orders
        } catch {
            return Order.sampleOrders
        }
    }

    // MARK: - Metas e Saldo
    public func fetchGoalStats(sellerId: String?) async throws -> GoalStats {
        var components = URLComponents(string: "\(baseURLString)/api/vendedor/metas")
        if let sId = sellerId {
            components?.queryItems = [URLQueryItem(name: "sellerId", value: sId)]
        }

        guard let url = components?.url else {
            return GoalStats.sample
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 10.0

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return GoalStats.sample
            }

            let res = try jsonDecoder.decode(GoalResponse.self, from: data)
            return res.stats ?? GoalStats.sample
        } catch {
            return GoalStats.sample
        }
    }

    // MARK: - Finalizar Venda / Criar Pedido
    public func finalizeSale(
        customerId: String,
        sellerId: String?,
        items: [CartItem],
        subtotal: Double,
        discount: Double,
        total: Double,
        paymentMethodName: String,
        notes: String
    ) async throws -> (saleNumber: String, orderId: String) {
        let endpoint = "\(baseURLString)/api/vendedor/pedidos"
        guard let url = URL(string: endpoint) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 15.0

        let itemsPayload: [[String: Any]] = items.map { item in
            [
                "productId": item.product.id,
                "name": item.product.name,
                "quantity": item.quantity,
                "price": item.unitPrice,
                "customization": [
                    "size": item.customization.size.rawValue,
                    "fabric": item.customization.fabricType,
                    "color": item.customization.fabricColor,
                    "extraFoam": item.customization.extraFoam.rawValue,
                    "observations": item.customization.observations
                ]
            ]
        }

        let body: [String: Any] = [
            "customerId": customerId,
            "sellerId": sellerId ?? "",
            "subtotal": subtotal,
            "discount": discount,
            "total": total,
            "notes": notes,
            "items": itemsPayload
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                // Modo offline: simula número de venda
                let fallbackNumber = "VEND-\(Int(Date().timeIntervalSince1970).description.suffix(6))"
                return (fallbackNumber, UUID().uuidString)
            }

            struct CreateOrderResponse: Codable {
                let success: Bool
                let saleNumber: String?
                let orderId: String?
                let error: String?
            }

            let res = try jsonDecoder.decode(CreateOrderResponse.self, from: data)
            return (res.saleNumber ?? "VEND-LOCAL", res.orderId ?? UUID().uuidString)
        } catch {
            let fallbackNumber = "VEND-\(Int(Date().timeIntervalSince1970).description.suffix(6))"
            return (fallbackNumber, UUID().uuidString)
        }
    }

    // MARK: - Envio de Localização
    public func syncLocation(userId: String, latitude: Double, longitude: Double) async {
        guard let url = URL(string: "\(baseURLString)/api/vendedor/location") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 5.0

        let body: [String: Any] = [
            "userId": userId,
            "latitude": latitude,
            "longitude": longitude
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: request)
    }
}
