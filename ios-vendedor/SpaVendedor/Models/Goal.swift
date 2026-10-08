import Foundation

public struct GoalStats: Codable {
    public var monthTotal: Double
    public var todayTotal: Double
    public var monthSalesCount: Int
    public var ticketMedio: Double
    public var targetAmount: Double
    public var progressPercent: Int
    public var commissionEstimated: Double

    public init(
        monthTotal: Double = 42800.0,
        todayTotal: Double = 3290.0,
        monthSalesCount: Int = 18,
        ticketMedio: Double = 2377.0,
        targetAmount: Double = 50000.0,
        progressPercent: Int = 85,
        commissionEstimated: Double = 2140.0
    ) {
        self.monthTotal = monthTotal
        self.todayTotal = todayTotal
        self.monthSalesCount = monthSalesCount
        self.ticketMedio = ticketMedio
        self.targetAmount = targetAmount
        self.progressPercent = progressPercent
        self.commissionEstimated = commissionEstimated
    }

    public static let sample = GoalStats()
}

public struct GoalResponse: Codable {
    public let success: Bool
    public let stats: GoalStats?
    public let error: String?
}
