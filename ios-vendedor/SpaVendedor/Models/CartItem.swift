import Foundation

public struct FabricColorOption: Identifiable, Codable, Hashable {
    public let id: String
    public let name: String
    public let hex: String
    public let desc: String
    public let isLight: Bool

    public init(id: String, name: String, hex: String, desc: String, isLight: Bool) {
        self.id = id
        self.name = name
        self.hex = hex
        self.desc = desc
        self.isLight = isLight
    }

    public static let standardColors: [FabricColorOption] = [
        FabricColorOption(id: "bege", name: "Bege Areia", hex: "#D4C4B5", desc: "Clássico, neutro e suave", isLight: true),
        FabricColorOption(id: "grafite", name: "Cinza Grafite", hex: "#4A4E51", desc: "Moderno e sofisticado", isLight: false),
        FabricColorOption(id: "preto", name: "Preto Ônix", hex: "#1A1A1A", desc: "Elegante e resistente", isLight: false),
        FabricColorOption(id: "marrom", name: "Marrom Café", hex: "#5A3825", desc: "Rústico e acolhedor", isLight: false),
        FabricColorOption(id: "marinho", name: "Azul Marinho", hex: "#1B2A4A", desc: "Tom nobre e contemporâneo", isLight: false),
        FabricColorOption(id: "cinza", name: "Cinza Prata", hex: "#A9ACB0", desc: "Iluminado e acetinado", isLight: true),
        FabricColorOption(id: "offwhite", name: "Off-White Pérola", hex: "#EDEBE6", desc: "Requinte e sofisticação", isLight: true),
        FabricColorOption(id: "bordo", name: "Bordô Vinho", hex: "#5E1926", desc: "Personalidade marcante", isLight: false)
    ]
}

public struct CustomizationOptions: Codable, Hashable {
    public var size: MattressSize = .casal
    public var customWidth: Double = 138.0
    public var customLength: Double = 188.0
    public var customHeight: Double = 25.0

    // Tecido Tampo Superior (Colchão)
    public var topFabric: String = "Matelassê Branco Acolchoado"

    // Tecido Tampo Inferior (Colchão - Reforma)
    public var bottomFabric: String = "TNT Antiderrapante Preto 100g"

    // TNT de Cima (Box)
    public var topTNT: String = "TNT Antiderrapante Preto 100g/150g"

    // Revestimento Faixa Lateral / Forragem Box (Veludo / Suede)
    public var fabricType: String = "Veludo Nobre"
    public var fabricColor: String = "Bege Areia"
    public var fabricColorHex: String = "#D4C4B5"

    // Fitilho de Fechamento (Debrum)
    public var fitilho: String = "Fitilho Tom sobre Tom"

    // Camada Extra de Espuma (Exclusivamente 5cm na Reforma de Colchão)
    public var extraFoam: ExtraFoamType = .none
    public var extraFoamHeight: Double = 0.0

    // Conversão para Vibroterapia (Reforma)
    public var isVibroConversion: Bool = false
    public var vibroPrice: Double = 850.0

    // Pés do Box
    public var feetType: String = "Pé Madeira Maciça 12cm Tabaco"

    // Observações Técnicas
    public var observations: String = ""

    public var extraPrice: Double {
        extraFoam.price + (isVibroConversion ? vibroPrice : 0.0)
    }

    public var summaryText: String {
        var parts: [String] = []
        parts.append(size.rawValue)
        parts.append("Tampo: \(topFabric)")
        if !bottomFabric.isEmpty && bottomFabric != "TNT Antiderrapante Preto 100g" {
            parts.append("Fundo: \(bottomFabric)")
        }
        parts.append("Tecido: \(fabricColor)")
        if !fitilho.isEmpty && fitilho != "Fitilho Tom sobre Tom" {
            parts.append(fitilho)
        }
        if extraFoam != .none {
            parts.append(extraFoam.badge)
        }
        if isVibroConversion {
            parts.append("Vibroterapia (+R$ 850)")
        }
        return parts.joined(separator: " • ")
    }

    public init() {}
}

public enum MattressSize: String, CaseIterable, Codable {
    case solteiro = "Solteiro (88x188)"
    case casal = "Casal (138x188)"
    case queen = "Queen (158x198)"
    case king = "King (193x203)"
    case sobMedida = "Sob Medida"

    public var dimensions: (width: Double, length: Double) {
        switch self {
        case .solteiro: return (88, 188)
        case .casal: return (138, 188)
        case .queen: return (158, 198)
        case .king: return (193, 203)
        case .sobMedida: return (0, 0)
        }
    }
}

public enum ExtraFoamType: String, CaseIterable, Codable {
    case none = "Sem Camada Extra (0 cm)"
    case d33_5cm = "Camada Adicional +5cm Espuma D-33 Conforto"
    case r26_5cm = "Camada Adicional +5cm Ortopédica Firme (R-26)"

    public var badge: String {
        switch self {
        case .none: return "Padrão"
        case .d33_5cm: return "+5cm Conforto"
        case .r26_5cm: return "+5cm Firme"
        }
    }

    public var price: Double {
        switch self {
        case .none: return 0.0
        case .d33_5cm: return 280.0
        case .r26_5cm: return 320.0
        }
    }
}

public struct CartItem: Identifiable, Codable, Hashable {
    public let id: UUID
    public let product: Product
    public var quantity: Int
    public var originalPrice: Double
    public var unitPrice: Double
    public var priceJustification: String?
    public var customization: CustomizationOptions

    public init(
        id: UUID = UUID(),
        product: Product,
        quantity: Int = 1,
        originalPrice: Double? = nil,
        unitPrice: Double? = nil,
        priceJustification: String? = nil,
        customization: CustomizationOptions = CustomizationOptions()
    ) {
        self.id = id
        self.product = product
        self.quantity = quantity
        let baseOfficial = originalPrice ?? (product.defaultPrice + customization.extraPrice)
        self.originalPrice = baseOfficial
        self.unitPrice = unitPrice ?? baseOfficial
        self.priceJustification = priceJustification
        self.customization = customization
    }

    public var totalAmount: Double {
        unitPrice * Double(quantity)
    }

    public var hasDiscount: Bool {
        unitPrice < originalPrice - 0.01
    }

    public var discountAmount: Double {
        max(0.0, (originalPrice - unitPrice) * Double(quantity))
    }

    public var discountPercent: Double {
        guard originalPrice > 0 else { return 0 }
        return max(0.0, ((originalPrice - unitPrice) / originalPrice) * 100.0)
    }

    public var hasCustomization: Bool {
        product.isReforma || product.isColchao || product.isBox
    }
}
