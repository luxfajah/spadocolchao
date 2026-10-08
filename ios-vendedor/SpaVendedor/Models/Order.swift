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

    public static let sampleOrders: [Order] = [
        Order(
            id: "ord_101",
            saleNumber: "VEND-202610-00405",
            customerName: "Mariana Alencar Guimarães",
            customerPhone: "(11) 98765-4321",
            customerAddress: "Av. Moema, 450 - Moema, São Paulo",
            status: .inProduction,
            totalAmount: 3290.0,
            createdAt: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-86400 * 2)),
            deliveryDate: ISO8601DateFormatter().string(from: Date().addingTimeInterval(86400 * 3)),
            items: [
                OrderItem(id: "oi_1", name: "Colchão SPA Hotel Molas Ensacadas - Queen", quantity: 1, unitPrice: 3290.0, total: 3290.0)
            ]
        ),
        Order(
            id: "ord_102",
            saleNumber: "VEND-202610-00406",
            customerName: "Roberto Mendes Silva",
            customerPhone: "(11) 97654-3210",
            customerAddress: "Rua Oscar Freire, 1280 - Jardins, São Paulo",
            status: .waitingDelivery,
            totalAmount: 1690.0,
            createdAt: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-86400 * 4)),
            deliveryDate: ISO8601DateFormatter().string(from: Date().addingTimeInterval(86400 * 1)),
            items: [
                OrderItem(id: "oi_2", name: "Reforma Completa de Colchão - Queen (+ D33)", quantity: 1, unitPrice: 1690.0, total: 1690.0)
            ]
        ),
        Order(
            id: "ord_103",
            saleNumber: "VEND-202610-00407",
            customerName: "Hotel Vila Primavera",
            customerPhone: "(11) 3210-9876",
            customerAddress: "Av. Macedo Soares, 100 - Capivari, Campos do Jordão",
            status: .sold,
            totalAmount: 7800.0,
            createdAt: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-3600 * 3)),
            deliveryDate: ISO8601DateFormatter().string(from: Date().addingTimeInterval(86400 * 7)),
            items: [
                OrderItem(id: "oi_3", name: "Reforma Conjunto Box e Colchão Hotel (Lote 4 un)", quantity: 4, unitPrice: 1950.0, total: 7800.0)
            ]
        ),
        Order(
            id: "ord_104",
            saleNumber: "VEND-202610-00408",
            customerName: "Fernanda Costa Silveira",
            customerPhone: "(11) 91234-5678",
            customerAddress: "Rua Pamplona, 930 - Bela Vista, São Paulo",
            status: .delivered,
            totalAmount: 2190.0,
            createdAt: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-86400 * 6)),
            deliveryDate: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-86400 * 1)),
            items: [
                OrderItem(id: "oi_4", name: "Colchão Ortopédico Espuma D33 - Casal", quantity: 1, unitPrice: 2190.0, total: 2190.0)
            ]
        )
    ]
}

// SwiftUI Color Helper Extensions
public extension Color {
    static let emerald = Color(red: 16/255, green: 185/255, blue: 129/255)
    static let amber = Color(red: 245/255, green: 158/255, blue: 11/255)
}
