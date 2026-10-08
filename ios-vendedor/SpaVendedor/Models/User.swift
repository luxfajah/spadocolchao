import Foundation

public struct User: Codable, Identifiable {
    public let id: String
    public let name: String
    public let email: String?
    public let username: String
    public let role: String
    public let sellerId: String?
    public let sellerCode: String?
    public let commissionRate: Double

    public init(
        id: String,
        name: String,
        email: String? = nil,
        username: String,
        role: String = "VENDEDOR",
        sellerId: String? = nil,
        sellerCode: String? = nil,
        commissionRate: Double = 0.05
    ) {
        self.id = id
        self.name = name
        self.email = email
        self.username = username
        self.role = role
        self.sellerId = sellerId
        self.sellerCode = sellerCode
        self.commissionRate = commissionRate
    }

    public static let demo = User(
        id: "usr_vendedor_demo",
        name: "Carlos Vendedor",
        email: "carlos@spadocolchao.com.br",
        username: "carlos.vendas",
        role: "VENDEDOR",
        sellerId: "sel_01",
        sellerCode: "VD-01",
        commissionRate: 0.05
    )
}

public struct AuthResponse: Codable {
    public let success: Bool
    public let token: String?
    public let user: User?
    public let error: String?
}
