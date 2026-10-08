import Foundation
import SwiftUI

public enum OrderStatus: String, Codable, CaseIterable {
    case sold = "SOLD"
    case waitingPreparation = "WAITING_PREPARATION"
    case inProduction = "IN_PRODUCTION"
    case waitingDelivery = "WAITING_DELIVERY"
    case delivered = "DELIVERED"
    case finalized = "FINALIZED"
    case cancelled = "CANCELLED"

    public var title: String {
        switch self {
        case .sold: return "Vendido"
        case .waitingPreparation: return "Preparação"
        case .inProduction: return "Em Produção"
        case .waitingDelivery: return "Em Rota / Entrega"
        case .delivered: return "Entregue"
        case .finalized: return "Concluído"
        case .cancelled: return "Cancelado"
        }
    }

    public var icon: String {
        switch self {
        case .sold: return "cart.badge.plus"
        case .waitingPreparation: return "ruler"
        case .inProduction: return "hammer.fill"
        case .waitingDelivery: return "truck.box.fill"
        case .delivered: return "checkmark.seal.fill"
        case .finalized: return "flag.checkered"
        case .cancelled: return "xmark.circle"
        }
    }

    public var color: Color {
        switch self {
        case .sold: return .amber
        case .waitingPreparation: return .orange
        case .inProduction: return .blue
        case .waitingDelivery: return .indigo
        case .delivered: return .emerald
        case .finalized: return .teal
        case .cancelled: return .secondary
        }
    }
}

public struct OrderItem: Codable, Identifiable, Hashable {
    public let id: String
    public let name: String
    public let quantity: Int
    public let unitPrice: Double
    public let total: Double
}

public struct Order: Codable, Identifiable, Hashable {
    public let id: String
    public let saleNumber: String
    public let customerName: String
    public let customerPhone: String
    public let customerAddress: String
    public let status: OrderStatus
    public let totalAmount: Double
    public let createdAt: String
    public let deliveryDate: String?
    public let items: [OrderItem]

    public var formattedDate: String {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: createdAt) {
            let display = DateFormatter()
            display.locale = Locale(identifier: "pt_BR")
            display.dateStyle = .short
            display.timeStyle = .short
            return display.string(from: date)
        }
        return createdAt
    }

    public static let sampleOrders: [Order] = []
}

// SwiftUI Color Helper Extensions
public extension Color {
    static let emerald = Color(red: 16/255, green: 185/255, blue: 129/255)
    static let amber = Color(red: 245/255, green: 158/255, blue: 11/255)

    init(hex: String) {
        let cleanHex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: cleanHex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch cleanHex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 128, 128, 128)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
