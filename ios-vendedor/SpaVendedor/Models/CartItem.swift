import Foundation

public struct CustomizationOptions: Codable, Hashable {
    public var size: MattressSize = .casal
    public var customWidth: Double = 138.0
    public var customLength: Double = 188.0
    public var customHeight: Double = 25.0

    public var fabricType: String = "Malha Belga Especial"
    public var fabricColor: String = "Branco com Fios Prata"

    public var extraFoam: ExtraFoamType = .none
    public var extraFoamHeight: Double = 0.0

    public var feetType: String = "Madeira Tabaco 12cm"
    public var observations: String = ""

    public var extraPrice: Double {
        var extra = 0.0
        switch extraFoam {
        case .none:
            break
        case .d28:
            extra += 280.0
        case .d33:
            extra += 390.0
        case .d45:
            extra += 540.0
        }
        return extra
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
    case none = "Sem Camada Extra"
    case d28 = "Espuma D28 (+5cm Conforto)"
    case d33 = "Espuma D33 (+5cm Firmeza)"
    case d45 = "Espuma D45 Ortopédica (+7cm Extra)"

    public var price: Double {
        switch self {
        case .none: return 0.0
        case .d28: return 280.0
        case .d33: return 390.0
        case .d45: return 540.0
        }
    }
}

public struct CartItem: Identifiable, Codable, Hashable {
    public let id: UUID
    public let product: Product
    public var quantity: Int
    public var unitPrice: Double
    public var customization: CustomizationOptions

    public init(
        id: UUID = UUID(),
        product: Product,
        quantity: Int = 1,
        unitPrice: Double? = nil,
        customization: CustomizationOptions = CustomizationOptions()
    ) {
        self.id = id
        self.product = product
        self.quantity = quantity
        self.unitPrice = unitPrice ?? (product.defaultPrice + customization.extraPrice)
        self.customization = customization
    }

    public var totalAmount: Double {
        unitPrice * Double(quantity)
    }

    public var hasCustomization: Bool {
        product.isReforma || product.isColchao || product.isBox
    }
}
