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
        type.localizedCaseInsensitiveContains("reforma") ||
        (operationalCategory ?? "").localizedCaseInsensitiveContains("reforma")
    }

    public var isColchao: Bool {
        name.localizedCaseInsensitiveContains("colchão") ||
        name.localizedCaseInsensitiveContains("colchao") ||
        type.localizedCaseInsensitiveContains("colchão") ||
        (operationalCategory ?? "").localizedCaseInsensitiveContains("colchão")
    }

    public var isBox: Bool {
        name.localizedCaseInsensitiveContains("box") ||
        type.localizedCaseInsensitiveContains("box") ||
        name.localizedCaseInsensitiveContains("baú") ||
        name.localizedCaseInsensitiveContains("bau") ||
        (operationalCategory ?? "").localizedCaseInsensitiveContains("box")
    }

    public var isPillowTop: Bool {
        name.localizedCaseInsensitiveContains("pillow") ||
        name.localizedCaseInsensitiveContains("pilow") ||
        (operationalCategory ?? "").localizedCaseInsensitiveContains("pillow")
    }

    public var isConjunto: Bool {
        name.localizedCaseInsensitiveContains("conjunto") ||
        type.localizedCaseInsensitiveContains("conjunto") ||
        ((name.localizedCaseInsensitiveContains("colchão") || name.localizedCaseInsensitiveContains("colchao")) &&
         (name.localizedCaseInsensitiveContains("box") || name.localizedCaseInsensitiveContains("baú") || name.localizedCaseInsensitiveContains("bau")))
    }

    public var isOnlyBox: Bool {
        !isConjunto && isBox && !isColchao
    }

    public var isOnlyColchao: Bool {
        !isConjunto && isColchao && !isBox
    }

    public var isReformaConjunto: Bool {
        isReforma && isConjunto
    }

    public var isReformaColchao: Bool {
        isReforma && isOnlyColchao
    }

    public var isReformaBox: Bool {
        isReforma && isOnlyBox
    }

    public var isColchaoNovo: Bool {
        !isReforma && isOnlyColchao
    }

    public var isCamaBox: Bool {
        !isReforma && isOnlyBox
    }

    public var detectedSize: String? {
        let lower = name.lowercased()
        if lower.contains("solteiro") || lower.contains("0,88") || lower.contains("88 x") || lower.contains("88x") { return "Solteiro" }
        if lower.contains("queen") || lower.contains("1,58") || lower.contains("158 x") || lower.contains("158x") { return "Queen" }
        if lower.contains("king") || lower.contains("1,93") || lower.contains("193 x") || lower.contains("193x") { return "King" }
        if lower.contains("casal") || lower.contains("1,38") || lower.contains("138 x") || lower.contains("138x") { return "Casal" }
        if lower.contains("sob medida") { return "Sob Medida" }
        return nil
    }

    public var categoryDisplayName: String {
        if isReformaConjunto { return "Reforma Conjunto" }
        if isReformaColchao { return "Reforma de Colchão" }
        if isReformaBox { return "Reforma de Box" }
        if isColchaoNovo { return "Colchão Novo" }
        if isCamaBox { return "Base Cama Box" }
        if isPillowTop { return "Pillow Top" }
        return "Acessório"
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
