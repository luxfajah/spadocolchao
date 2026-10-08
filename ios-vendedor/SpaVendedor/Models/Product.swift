import Foundation

public struct Product: Codable, Identifiable, Hashable {
    public let id: String
    public let name: String
    public let type: String
    public let operationalCategory: String?
    public let defaultPrice: Double
    public let minimumPrice: Double?
    public let defaultCost: Double?
    public let description: String?
    public let highlightInPDV: BooleanString?

    public enum BooleanString: Codable, Hashable {
        case bool(Bool)
        case int(Int)

        public init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if let b = try? container.decode(Bool.self) {
                self = .bool(b)
            } else if let i = try? container.decode(Int.self) {
                self = .int(i)
            } else {
                self = .bool(false)
            }
        }

        public func encode(to encoder: Encoder) throws {
            var container = encoder.singleValueContainer()
            switch self {
            case .bool(let b): try container.encode(b)
            case .int(let i): try container.encode(i)
            }
        }

        public var isTrue: Bool {
            switch self {
            case .bool(let b): return b
            case .int(let i): return i > 0
            }
        }
    }

    public var effectiveMinPrice: Double {
        minimumPrice ?? (defaultPrice * 0.85) // Trava de segurança de desconto máximo 15%
    }

    public var isReforma: Bool {
        name.localizedCaseInsensitiveContains("reforma") ||
        type.localizedCaseInsensitiveContains("reforma")
    }

    public var isColchao: Bool {
        name.localizedCaseInsensitiveContains("colchão") ||
        name.localizedCaseInsensitiveContains("colchao") ||
        type.localizedCaseInsensitiveContains("colchão")
    }

    public var isBox: Bool {
        name.localizedCaseInsensitiveContains("box") ||
        type.localizedCaseInsensitiveContains("box")
    }

    public init(
        id: String,
        name: String,
        type: String,
        operationalCategory: String? = nil,
        defaultPrice: Double,
        minimumPrice: Double? = nil,
        defaultCost: Double? = nil,
        description: String? = nil,
        highlightInPDV: BooleanString? = nil
    ) {
        self.id = id
        self.name = name
        self.type = type
        self.operationalCategory = operationalCategory
        self.defaultPrice = defaultPrice
        self.minimumPrice = minimumPrice
        self.defaultCost = defaultCost
        self.description = description
        self.highlightInPDV = highlightInPDV
    }

    public static let sampleProducts: [Product] = []
}
