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

    public static let sampleProducts: [Product] = [
        Product(
            id: "prod_01",
            name: "Colchão SPA Hotel Molas Ensacadas - Queen (158x198)",
            type: "Colchão SPA",
            operationalCategory: "COLCHAO_NOVO",
            defaultPrice: 3290.0,
            minimumPrice: 2850.0,
            defaultCost: 1450.0,
            description: "Molas ensacadas individuais, pillow top europeu, malha belga com fios de prata.",
            highlightInPDV: .bool(true)
        ),
        Product(
            id: "prod_02",
            name: "Colchão Ortopédico Espuma D33 - Casal (138x188)",
            type: "Colchão SPA",
            operationalCategory: "COLCHAO_NOVO",
            defaultPrice: 2190.0,
            minimumPrice: 1950.0,
            defaultCost: 980.0,
            description: "Núcleo alta densidade D33 certificado, tecido antiácaro e antifúngico.",
            highlightInPDV: .bool(true)
        ),
        Product(
            id: "prod_03",
            name: "Reforma Completa de Colchão - Casal (138x188)",
            type: "Reforma Colchão",
            operationalCategory: "REFORMA_COLCHAO",
            defaultPrice: 1390.0,
            minimumPrice: 1190.0,
            defaultCost: 490.0,
            description: "Troca total de tecido tampo/lateral, alinhamento estrutural e higienização profunda.",
            highlightInPDV: .bool(true)
        ),
        Product(
            id: "prod_04",
            name: "Reforma Completa de Colchão - Queen (158x198)",
            type: "Reforma Colchão",
            operationalCategory: "REFORMA_COLCHAO",
            defaultPrice: 1690.0,
            minimumPrice: 1450.0,
            defaultCost: 610.0,
            description: "Troca completa do revestimento por linho/suede e reforço estrutural.",
            highlightInPDV: .bool(true)
        ),
        Product(
            id: "prod_05",
            name: "Reforma de Cama Box Baú - Casal",
            type: "Reforma Box",
            operationalCategory: "REFORMA_BOX",
            defaultPrice: 890.0,
            minimumPrice: 750.0,
            defaultCost: 310.0,
            description: "Troca de pistões amortecedores, reforço de estrado e tecido suede novo.",
            highlightInPDV: .bool(false)
        ),
        Product(
            id: "prod_06",
            name: "Colchão SPA Imperial King Size (193x203)",
            type: "Colchão SPA",
            operationalCategory: "COLCHAO_NOVO",
            defaultPrice: 4890.0,
            minimumPrice: 4200.0,
            defaultCost: 2100.0,
            description: "Topo de linha. Molas ensacadas 2.2, dupla camada de espuma D45 e látex natural.",
            highlightInPDV: .bool(true)
        ),
        Product(
            id: "prod_07",
            name: "Travesseiro SPA Viscoelástico Nasa - 50x70",
            type: "Acessório",
            operationalCategory: "ACESSORIOS",
            defaultPrice: 169.0,
            minimumPrice: 139.0,
            defaultCost: 65.0,
            description: "Espuma termosensível que molda o contorno da cabeça e alivia pressão cervical.",
            highlightInPDV: .bool(false)
        ),
        Product(
            id: "prod_08",
            name: "Protetor Impermeável Respirável - Queen",
            type: "Acessório",
            operationalCategory: "ACESSORIOS",
            defaultPrice: 189.0,
            minimumPrice: 159.0,
            defaultCost: 75.0,
            description: "100% impermeável, anti-ruído e lavável em máquina.",
            highlightInPDV: .bool(false)
        )
    ]
}
