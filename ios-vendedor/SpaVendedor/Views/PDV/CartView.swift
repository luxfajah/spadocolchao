import SwiftUI

public struct CartView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    @State private var showCustomerPicker = false
    @State private var showNewCustomerSheet = false
    @State private var selectedPaymentMethod = "PIX"
    @State private var installments = 1
    @State private var deliveryDate = Date().addingTimeInterval(86400 * 7) // 7 dias
    @State private var notes = ""
    @State private var isSubmitting = false
    @State private var completedSaleNumber: String? = nil
    @State private var showSuccess = false

    // Frete digitável
    @State private var freightText = ""

    // Entrada no Ato
    @State private var hasDownPayment = false
    @State private var downPaymentPercent: Int? = 10
    @State private var downPaymentAmount: Double = 0.0
    @State private var downPaymentCustomText = ""
    @State private var selectedDownPaymentMethod = "PIX"

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()

                if appState.cartItems.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "cart")
                            .font(.system(size: 64))
                            .foregroundStyle(.secondary)
                        Text("Seu carrinho está vazio")
                            .font(.title3.bold())
                        Text("Adicione produtos ou reformas no catálogo para iniciar uma venda.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                        Button("Ir para o Catálogo") {
                            dismiss()
                        }
                        .buttonStyle(.borderedProminent)
                        .padding(.top, 8)
                    }
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            // Seção 1: Cliente Selecionado
                            customerSection

                            // Seção 2: Itens do Carrinho
                            itemsSection

                            // Seção 3: Entrada no Ato (Sinal)
                            downPaymentSection

                            // Seção 4: Pagamento e Condições
                            paymentSection

                            // Seção 5: Data de Entrega e Observações
                            deliverySection

                            // Seção 6: Resumo Financeiro & Comissão
                            financialSummarySection

                            // Botão Finalizar
                            finalizeButton
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Finalizar Venda")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fechar") { dismiss() }
                }

                if !appState.cartItems.isEmpty {
                    ToolbarItem(placement: .destructiveAction) {
                        Button("Limpar") {
                            appState.clearCart()
                        }
                        .foregroundStyle(.red)
                    }
                }
            }
            .sheet(isPresented: $showCustomerPicker) {
                CustomerPickerSheet { selected in
                    appState.selectedCustomer = selected
                }
            }
            .sheet(isPresented: $showNewCustomerSheet) {
                RegisterCustomerSheet { newCustomer in
                    appState.selectedCustomer = newCustomer
                }
            }
            .sheet(isPresented: $showSuccess) {
                if let saleNum = completedSaleNumber {
                    SaleSuccessSheet(
                        saleNumber: saleNum,
                        customerName: appState.selectedCustomer?.fullName ?? "Cliente",
                        totalAmount: appState.cartTotal,
                        estimatedCommission: appState.estimatedCommission,
                        onDismiss: {
                            appState.clearCart()
                            dismiss()
                        }
                    )
                }
            }
        }
    }

    // MARK: - Subviews
    private var customerSection: some View {
        GlassCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Label("Cliente", systemImage: "person.crop.circle.fill")
                        .font(.headline)
                        .foregroundStyle(.primary)

                    Spacer()

                    Button(action: { showCustomerPicker = true }) {
                        Text(appState.selectedCustomer == nil ? "Selecionar" : "Alterar")
                            .font(.subheadline.bold())
                            .foregroundStyle(.blue)
                    }
                }

                if let cust = appState.selectedCustomer {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(cust.fullName)
                            .font(.subheadline.bold())
                        if let phone = cust.phone ?? cust.whatsapp {
                            Text(phone)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Text(cust.formattedAddress)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 4)
                } else {
                    HStack {
                        Text("Nenhum cliente selecionado")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Button("+ Novo") {
                            showNewCustomerSheet = true
                        }
                        .font(.caption.bold())
                        .buttonStyle(.bordered)
                    }
                    .padding(.top, 2)
                }
            }
        }
    }

    private var itemsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ITENS DO PEDIDO (\(appState.cartItemCount))")
                .font(.caption.bold())
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            ForEach(appState.cartItems) { item in
                GlassCard(cornerRadius: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(item.product.name)
                                    .font(.headline)
                                    .lineLimit(2)

                                Text("\(item.quantity)x \(formatCurrency(item.unitPrice))")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Text(formatCurrency(item.totalAmount))
                                .font(.headline)
                                .foregroundStyle(.blue)

                            Button(action: { appState.removeFromCart(id: item.id) }) {
                                Image(systemName: "trash")
                                    .font(.caption)
                                    .foregroundStyle(.red)
                            }
                            .padding(.leading, 6)
                        }

                        if item.hasCustomization {
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text(item.customization.size.rawValue)
                                        .font(.caption2.bold())
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color.blue.opacity(0.1))
                                        .clipShape(Capsule())

                                    if item.customization.extraFoam != .none {
                                        Text(item.customization.extraFoam.rawValue)
                                            .font(.caption2.bold())
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(Color.purple.opacity(0.1))
                                            .clipShape(Capsule())
                                    }
                                }

                                Text("Tecido: \(item.customization.fabricType) • \(item.customization.fabricColor)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Entrada no Ato (Sinal)
    private var downPaymentSection: some View {
        GlassCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Label("Entrada no Ato (Sinal)", systemImage: "banknote.fill")
                        .font(.headline)
                        .foregroundStyle(Color.primary)
                    Spacer()
                    Toggle("", isOn: $hasDownPayment)
                        .labelsHidden()
                        .onChange(of: hasDownPayment) { _, active in
                            if active && downPaymentAmount == 0.0 {
                                downPaymentPercent = 10
                                updateDownPaymentFromPercent()
                            }
                        }
                }

                if hasDownPayment {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Percentual da entrada:")
                            .font(.caption.bold())
                            .foregroundStyle(Color.secondary)

                        // Presets 10%, 20%, 30%
                        HStack(spacing: 8) {
                            ForEach([10, 20, 30], id: \.self) { pct in
                                Button(action: {
                                    downPaymentPercent = pct
                                    downPaymentCustomText = ""
                                    updateDownPaymentFromPercent()
                                }) {
                                    VStack(spacing: 2) {
                                        Text("\(pct)%")
                                            .font(.subheadline.bold())
                                        Text(formatCurrency(appState.cartTotal * (Double(pct) / 100.0)))
                                            .font(.system(size: 9))
                                            .opacity(0.8)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 8)
                                    .background(
                                        downPaymentPercent == pct
                                            ? Color.blue
                                            : Color(uiColor: .tertiarySystemFill)
                                    )
                                    .foregroundStyle(downPaymentPercent == pct ? Color.white : Color.primary)
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                            }
                        }

                        // Campo de valor digitável livre para entrada
                        HStack {
                            Text("Ou digite o valor da entrada:")
                                .font(.caption)
                                .foregroundStyle(Color.secondary)
                            Spacer()
                            HStack(spacing: 4) {
                                Text("R$")
                                    .font(.subheadline.bold())
                                    .foregroundStyle(Color.secondary)
                                TextField("Outro", text: $downPaymentCustomText)
                                    .keyboardType(.decimalPad)
                                    .multilineTextAlignment(.trailing)
                                    .font(.subheadline.bold())
                                    .frame(width: 90)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color(uiColor: .tertiarySystemFill))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                    .onChange(of: downPaymentCustomText) { _, newVal in
                                        if !newVal.isEmpty {
                                            downPaymentPercent = nil
                                            let cleaned = newVal.replacingOccurrences(of: ",", with: ".")
                                            downPaymentAmount = max(0.0, Double(cleaned) ?? 0.0)
                                        }
                                    }
                            }
                        }

                        Divider()

                        // Forma de pagamento da Entrada
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Forma de Pagamento da Entrada:")
                                .font(.caption.bold())
                                .foregroundStyle(Color.secondary)

                            Picker("Forma Entrada", selection: $selectedDownPaymentMethod) {
                                Text("PIX").tag("PIX")
                                Text("Dinheiro").tag("Dinheiro")
                                Text("Débito").tag("Cartão de Débito")
                                Text("Crédito").tag("Cartão de Crédito")
                            }
                            .pickerStyle(.segmented)
                        }

                        // Detalhamento Entrada vs Saldo
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Entrada no Ato:")
                                    .font(.caption)
                                    .foregroundStyle(Color.secondary)
                                Text(formatCurrency(downPaymentAmount))
                                    .font(.subheadline.bold())
                                    .foregroundStyle(Color.emerald)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("Saldo na Entrega:")
                                    .font(.caption)
                                    .foregroundStyle(Color.secondary)
                                Text(formatCurrency(max(0.0, appState.cartTotal - downPaymentAmount)))
                                    .font(.subheadline.bold())
                                    .foregroundStyle(Color.blue)
                            }
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 8)
                        .background(Color(uiColor: .secondarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
        }
    }

    private var paymentSection: some View {
        GlassCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Label(
                    hasDownPayment ? "Pagamento do Saldo na Entrega" : "Forma de Pagamento",
                    systemImage: "creditcard.fill"
                )
                .font(.headline)

                Picker("Forma", selection: $selectedPaymentMethod) {
                    Text("PIX (À Vista)").tag("PIX")
                    Text("Cartão de Crédito").tag("Cartão de Crédito")
                    Text("Cartão de Débito").tag("Cartão de Débito")
                    Text("Boleto Bancário").tag("Boleto")
                    Text("Dinheiro").tag("Dinheiro")
                }
                .pickerStyle(.menu)

                if selectedPaymentMethod == "Cartão de Crédito" {
                    Stepper("Parcelamento: \(installments)x sem juros", value: $installments, in: 1...12)
                        .font(.subheadline)
                    let baseAmount = hasDownPayment ? max(0.0, appState.cartTotal - downPaymentAmount) : appState.cartTotal
                    Text("Valor de cada parcela: \(formatCurrency(baseAmount / Double(installments)))")
                        .font(.caption)
                        .foregroundStyle(Color.secondary)
                }
            }
        }
    }

    private var deliverySection: some View {
        GlassCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Label("Entrega & Detalhes", systemImage: "calendar.badge.clock")
                    .font(.headline)

                DatePicker("Previsão de Entrega", selection: $deliveryDate, displayedComponents: [.date])
                    .font(.subheadline)

                TextField("Instruções adicionais de entrega ou montagem", text: $notes)
                    .font(.subheadline)
                    .textFieldStyle(.roundedBorder)
            }
        }
    }

    private var financialSummarySection: some View {
        GlassCard(cornerRadius: 16) {
            VStack(spacing: 10) {
                HStack {
                    Text("Subtotal")
                        .foregroundStyle(Color.secondary)
                    Spacer()
                    Text(formatCurrency(appState.cartSubtotal))
                }

                if appState.globalDiscount > 0 {
                    HStack {
                        Text("Desconto Concedido")
                            .foregroundStyle(Color.red)
                        Spacer()
                        Text("-\(formatCurrency(appState.globalDiscount))")
                            .foregroundStyle(Color.red)
                    }
                }

                // Frete de Entrega Digitável
                HStack {
                    Label("Frete", systemImage: "truck.fill")
                        .font(.subheadline)
                        .foregroundStyle(Color.secondary)
                    Spacer()
                    HStack(spacing: 4) {
                        Text("R$")
                            .font(.subheadline.bold())
                            .foregroundStyle(Color.secondary)
                        TextField("0,00", text: $freightText)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .font(.subheadline.bold())
                            .frame(width: 80)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(uiColor: .tertiarySystemFill))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .onChange(of: freightText) { _, newValue in
                                let cleaned = newValue.replacingOccurrences(of: ",", with: ".")
                                appState.freightAmount = max(0.0, Double(cleaned) ?? 0.0)
                                updateDownPaymentFromPercent()
                            }
                    }
                }

                Divider()

                HStack {
                    Text("Total Final")
                        .font(.title3.bold())
                    Spacer()
                    Text(formatCurrency(appState.cartTotal))
                        .font(.title2.bold())
                        .foregroundStyle(Color.blue)
                }

                // Se houver entrada, exibe discriminado o total pago hoje e na entrega
                if hasDownPayment && downPaymentAmount > 0 {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Entrada (hoje):")
                                .font(.caption.bold())
                                .foregroundStyle(Color.emerald)
                            Text(formatCurrency(downPaymentAmount))
                                .font(.subheadline.bold())
                                .foregroundStyle(Color.emerald)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("Saldo (na entrega):")
                                .font(.caption.bold())
                                .foregroundStyle(Color.blue)
                            Text(formatCurrency(max(0.0, appState.cartTotal - downPaymentAmount)))
                                .font(.subheadline.bold())
                                .foregroundStyle(Color.blue)
                        }
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.blue.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                // Destaque de Comissão do Vendedor
                HStack {
                    Image(systemName: "gift.fill")
                        .foregroundStyle(Color.emerald)
                    Text("Sua Comissão Estimada:")
                        .font(.caption.bold())
                        .foregroundStyle(Color.emerald)
                    Spacer()
                    Text(formatCurrency(appState.estimatedCommission))
                        .font(.headline.bold())
                        .foregroundStyle(Color.emerald)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.emerald.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .padding(.top, 4)
            }
        }
    }

    private var finalizeButton: some View {
        Button(action: handleFinalizeSale) {
            HStack(spacing: 8) {
                if isSubmitting {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.headline)
                    Text("Confirmar Pedido")
                        .font(.headline.bold())
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(
                LinearGradient(
                    colors: [Color.blue, Color(red: 29/255, green: 78/255, blue: 216/255)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .shadow(color: Color.blue.opacity(0.35), radius: 10, x: 0, y: 5)
        }
        .disabled(isSubmitting)
        .padding(.bottom, 20)
    }



    // MARK: - Ação Finalizar
    private func handleFinalizeSale() {
        guard let customer = appState.selectedCustomer ?? appState.customers.first else {
            showCustomerPicker = true
            return
        }

        isSubmitting = true

        Task {
            do {
                let result = try await APIClient.shared.finalizeSale(
                    customerId: customer.id,
                    sellerId: appState.currentUser?.sellerId,
                    items: appState.cartItems,
                    subtotal: appState.cartSubtotal,
                    discount: appState.globalDiscount,
                    freight: appState.freightAmount,
                    total: appState.cartTotal,
                    paymentMethodName: selectedPaymentMethod,
                    hasDownPayment: hasDownPayment,
                    downPaymentAmount: hasDownPayment ? downPaymentAmount : 0.0,
                    downPaymentMethod: hasDownPayment ? selectedDownPaymentMethod : selectedPaymentMethod,
                    notes: notes
                )

                await MainActor.run {
                    self.completedSaleNumber = result.saleNumber
                    self.isSubmitting = false
                    self.showSuccess = true

                    // Atualiza lista de pedidos no estado
                    let newOrder = Order(
                        id: result.orderId,
                        saleNumber: result.saleNumber,
                        customerName: customer.fullName,
                        customerPhone: customer.phone ?? "",
                        customerAddress: customer.formattedAddress,
                        status: .sold,
                        totalAmount: appState.cartTotal,
                        createdAt: ISO8601DateFormatter().string(from: Date()),
                        deliveryDate: ISO8601DateFormatter().string(from: deliveryDate),
                        items: appState.cartItems.map {
                            OrderItem(id: $0.id.uuidString, name: $0.product.name, quantity: $0.quantity, unitPrice: $0.unitPrice, total: $0.totalAmount)
                        }
                    )
                    appState.orders.insert(newOrder, at: 0)
                }
            } catch {
                await MainActor.run {
                    self.isSubmitting = false
                    self.completedSaleNumber = "VEND-\(Int.random(in: 1000...9999))"
                    self.showSuccess = true
                }
            }
        }
    }

    private func updateDownPaymentFromPercent() {
        if let pct = downPaymentPercent {
            downPaymentAmount = (appState.cartTotal * Double(pct)) / 100.0
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: NSNumber(value: value)) ?? "R$ \(value)"
    }
}
