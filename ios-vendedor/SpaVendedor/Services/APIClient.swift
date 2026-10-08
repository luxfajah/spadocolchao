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
            return ([], [])
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 12.0

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        struct PDVInitResponse: Codable {
            let success: Bool
            let products: [Product]
            let customers: [Customer]
        }

        let res = try jsonDecoder.decode(PDVInitResponse.self, from: data)
        return (res.products, res.customers)
    }

    // MARK: - Cadastro Completo de Cliente
    public func createCustomer(customer: Customer, sellerId: String?) async throws -> Customer {
        let endpoint = "\(baseURLString)/api/clientes"
        guard let url = URL(string: endpoint) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 15.0

        let body: [String: Any] = [
            "personType": customer.personType,
            "fullName": customer.fullName,
            "tradeName": customer.tradeName ?? "",
            "document": customer.document ?? "",
            "rg": customer.rg ?? "",
            "birthDate": customer.birthDate ?? "",
            "email": customer.email ?? "",
            "phone": customer.phone ?? "",
            "whatsapp": customer.whatsapp ?? "",
            "notes": customer.notes ?? "",
            "zipCode": customer.zipCode ?? "",
            "street": customer.addressStreet ?? "",
            "number": customer.addressNumber ?? "",
            "complement": customer.addressComplement ?? "",
            "neighborhood": customer.addressNeighborhood ?? "",
            "city": customer.addressCity ?? "",
            "state": customer.addressState ?? "",
            "sellerId": sellerId ?? ""
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (httpResponse.statusCode == 200 || httpResponse.statusCode == 201) else {
            if let errObj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let message = errObj["error"] as? String {
                throw NSError(domain: "CustomerError", code: 400, userInfo: [NSLocalizedDescriptionKey: message])
            }
            throw URLError(.badServerResponse)
        }

        struct CreateCustomerResponse: Codable {
            let success: Bool
            let customer: Customer?
        }

        let res = try jsonDecoder.decode(CreateCustomerResponse.self, from: data)
        guard let created = res.customer else {
            throw NSError(domain: "CustomerError", code: 400, userInfo: [NSLocalizedDescriptionKey: "Cliente não retornado pelo servidor"])
        }
        return created
    }

    // MARK: - Pedidos / Kanban
    public func fetchOrders(sellerId: String?, isAdmin: Bool = false) async throws -> [Order] {
        var components = URLComponents(string: "\(baseURLString)/api/vendedor/pedidos")
        var queryItems: [URLQueryItem] = []
        if let sId = sellerId, !sId.isEmpty {
            queryItems.append(URLQueryItem(name: "sellerId", value: sId))
        }
        if isAdmin {
            queryItems.append(URLQueryItem(name: "isAdmin", value: "true"))
        }
        if !queryItems.isEmpty {
            components?.queryItems = queryItems
        }

        guard let url = components?.url else {
            return []
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 12.0

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        struct OrdersResponse: Codable {
            let success: Bool
            let orders: [Order]
        }

        let res = try jsonDecoder.decode(OrdersResponse.self, from: data)
        return res.orders
    }

    // MARK: - Metas e Saldo
    public func fetchGoalStats(sellerId: String?) async throws -> GoalStats {
        var components = URLComponents(string: "\(baseURLString)/api/vendedor/metas")
        if let sId = sellerId, !sId.isEmpty {
            components?.queryItems = [URLQueryItem(name: "sellerId", value: sId)]
        }

        guard let url = components?.url else {
            return GoalStats()
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 12.0

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            return GoalStats()
        }

        let res = try jsonDecoder.decode(GoalResponse.self, from: data)
        return res.stats ?? GoalStats()
    }

    // MARK: - Visitas
    public func fetchVisits(sellerId: String?) async throws -> [Visit] {
        var components = URLComponents(string: "\(baseURLString)/api/visitas")
        if let sId = sellerId, !sId.isEmpty {
            components?.queryItems = [URLQueryItem(name: "sellerId", value: sId)]
        }

        guard let url = components?.url else {
            return []
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 12.0

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            return []
        }

        return (try? jsonDecoder.decode([Visit].self, from: data)) ?? []
    }

    public func createVisit(
        sellerId: String?,
        clientName: String,
        clientPhone: String?,
        clientAddress: String?,
        visitDate: String,
        notes: String?
    ) async throws -> Visit {
        let endpoint = "\(baseURLString)/api/visitas"
        guard let url = URL(string: endpoint) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 15.0

        let body: [String: Any] = [
            "sellerId": sellerId ?? "",
            "clientName": clientName,
            "clientPhone": clientPhone ?? "",
            "clientAddress": clientAddress ?? "",
            "visitDate": visitDate,
            "notes": notes ?? ""
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (httpResponse.statusCode == 200 || httpResponse.statusCode == 201) else {
            throw URLError(.badServerResponse)
        }

        return try jsonDecoder.decode(Visit.self, from: data)
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

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }

        struct CreateOrderResponse: Codable {
            let success: Bool
            let saleNumber: String?
            let orderId: String?
            let error: String?
        }

        let res = try jsonDecoder.decode(CreateOrderResponse.self, from: data)
        guard res.success, let saleNum = res.saleNumber, let ordId = res.orderId else {
            throw NSError(domain: "PDVError", code: 400, userInfo: [NSLocalizedDescriptionKey: res.error ?? "Erro ao salvar pedido no servidor"])
        }
        return (saleNum, ordId)
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
