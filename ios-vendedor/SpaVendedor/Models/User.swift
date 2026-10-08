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
    public let isAdmin: Bool

    public var commissionPercent: Double {
        commissionRate >= 1.0 ? commissionRate : commissionRate * 100.0
    }

    public var commissionFraction: Double {
        commissionRate >= 1.0 ? commissionRate / 100.0 : commissionRate
    }

    public init(
        id: String,
        name: String,
        email: String? = nil,
        username: String,
        role: String = "VENDEDOR",
        sellerId: String? = nil,
        sellerCode: String? = nil,
        commissionRate: Double = 0.05,
        isAdmin: Bool = false
    ) {
        self.id = id
        self.name = name
        self.email = email
        self.username = username
        self.role = role
        self.sellerId = sellerId
        self.sellerCode = sellerCode
        self.commissionRate = commissionRate
        self.isAdmin = isAdmin
    }

    enum CodingKeys: String, CodingKey {
        case id, name, email, username, role, sellerId, sellerCode, commissionRate, isAdmin
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decode(String.self, forKey: .id)
        self.name = try container.decode(String.self, forKey: .name)
        self.email = try container.decodeIfPresent(String.self, forKey: .email)
        self.username = try container.decode(String.self, forKey: .username)
        self.role = try container.decodeIfPresent(String.self, forKey: .role) ?? "VENDEDOR"
        self.sellerId = try container.decodeIfPresent(String.self, forKey: .sellerId)
        self.sellerCode = try container.decodeIfPresent(String.self, forKey: .sellerCode)
        self.commissionRate = try container.decodeIfPresent(Double.self, forKey: .commissionRate) ?? 0.05
        self.isAdmin = try container.decodeIfPresent(Bool.self, forKey: .isAdmin) ?? (self.role.uppercased().contains("ADMIN"))
    }
}

public struct AuthResponse: Codable {
    public let success: Bool
    public let token: String?
    public let user: User?
    public let error: String?
}
