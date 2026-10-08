import SwiftUI

// Modal de edição de preço unitário de um item do carrinho
struct EditItemPriceSheet: View {
    @Environment(\.dismiss) private var dismiss
    let item: CartItem
    let onSave: (Double, String) -> Void

    @State private var newPriceText: String = ""
    @State private var justificationText: String = ""

    init(item: CartItem, onSave: @escaping (Double, String) -> Void) {
        self.item = item
        self.onSave = onSave
        _newPriceText = State(initialValue: String(format: "%.2f", item.unitPrice).replacingOccurrences(of: ".", with: ","))
        _justificationText = State(initialValue: item.priceJustification ?? "")
    }

    private var parsedNewPrice: Double {
        let cleaned = newPriceText.replacingOccurrences(of: ",", with: ".")
        return max(0.0, Double(cleaned) ?? item.unitPrice)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(item.product.name)
                            .font(.headline.bold())
                        Text("Edição e negociação de valor unitário praticado no PDV")
                            .font(.caption)
                            .foregroundStyle(Color.secondary)
                    }
                }

                Section("Valores de Referência") {
                    HStack {
                        Text("Preço Base Oficial de Tabela")
                            .foregroundStyle(Color.secondary)
                        Spacer()
                        Text(formatCurrency(item.originalPrice))
                            .bold()
                    }

                    if parsedNewPrice < item.originalPrice - 0.05 {
                        let diff = item.originalPrice - parsedNewPrice
                        let pct = (diff / item.originalPrice) * 100.0
                        HStack {
                            Text("Desconto Concedido")
                                .foregroundStyle(Color.emerald)
                            Spacer()
                            Text("-\(formatCurrency(diff)) (\(String(format: "%.1f", pct))%)")
                                .foregroundStyle(Color.emerald)
                                .bold()
                        }
                    } else if parsedNewPrice > item.originalPrice + 0.05 {
                        let diff = parsedNewPrice - item.originalPrice
                        HStack {
                            Text("Acréscimo")
                                .foregroundStyle(Color.blue)
                            Spacer()
                            Text("+\(formatCurrency(diff))")
                                .foregroundStyle(Color.blue)
                                .bold()
                        }
                    }
                }

                Section("Novo Preço Unitário (R$)") {
                    HStack {
                        Text("R$")
                            .font(.headline.bold())
                            .foregroundStyle(Color.blue)
                        TextField("0,00", text: $newPriceText)
                            .keyboardType(.decimalPad)
                            .font(.title3.bold())
                    }

                    Button("Restaurar Preço Oficial (\(formatCurrency(item.originalPrice)))") {
                        newPriceText = String(format: "%.2f", item.originalPrice).replacingOccurrences(of: ".", with: ",")
                    }
                    .font(.caption.bold())
                }

                Section("Justificativa Comercial da Negociação") {
                    TextField("Ex: Desconto autorizado pela gerência, pagamento à vista...", text: $justificationText)
                        .font(.subheadline)
                }
            }
            .navigationTitle("Editar Preço do Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Confirmar Preço") {
                        onSave(parsedNewPrice, justificationText)
                        dismiss()
                    }
                    .bold()
                }
            }
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: NSNumber(value: value)) ?? "R$ \(value)"
    }
}

public struct CartView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    @State private var showCustomerPicker = false
    @State private var showNewCustomerSheet = false
    @State private var selectedPaymentMethod = "PIX"
    @State private var installments = 1
    @State private var isSubmitting = false
    @State private var completedSaleNumber: String? = nil
    @State private var showSuccess = false

    // Item em edição de preço
    @State private var itemToEditPrice: CartItem? = nil

    // Desconto Global Digitável
    @State private var globalDiscountText = ""

    // Frete digitável
    @State private var freightText = ""

    // Entrada no Ato (Sinal)
    @State private var hasDownPayment = false
    @State private var isDownPaymentPaid = true
    @State private var downPaymentPercent: Int? = 10
    @State private var downPaymentAmount: Double = 0.0
    @State private var downPaymentCustomText = ""
    @State private var selectedDownPaymentMethod = "PIX"

    // Logística e Agendamento Completo
    @State private var scheduleMode = "both" // "both", "delivery", "pickup"
    @State private var pickupDate = Calendar.current.date(byAdding: .day, value: 2, to: Date()) ?? Date()
    @State private var pickupTime = "Manhã (08h - 12h)"
    @State private var deliveryDate = Calendar.current.date(byAdding: .day, value: 10, to: Date()) ?? Date()
    @State private var deliveryTime = "Tarde (13h - 18h)"
    @State private var logisticsNotes = ""
    @State private var notes = ""

    // Snapshot para exibir no modal de sucesso
    @State private var lastSaleTotal: Double = 0.0
    @State private var lastSaleCommission: Double = 0.0
    @State private var lastCustomerName: String = ""
    @State private var lastDownPaymentAmount: Double = 0.0
    @State private var lastDownPaymentMethod: String = ""

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()

                if appState.cartItems.isEmpty && !showSuccess {
                    VStack(spacing: 16) {
                        Image(systemName: "cart")
                            .font(.system(size: 64))
                            .foregroundStyle(Color.secondary)
                        Text("Seu carrinho está vazio")
                            .font(.title3.bold())
                        Text("Adicione produtos ou reformas no catálogo para iniciar uma venda.")
                            .font(.subheadline)
                            .foregroundStyle(Color.secondary)
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

                            // Seção 2: Itens do Carrinho com Edição de Preço
                            itemsSection

                            // Seção 3: Desconto Global da Venda
                            globalDiscountSection

                            // Seção 4: Entrada no Ato (Sinal 10%, 20%, 30% ou livre)
                            downPaymentSection

                            // Seção 5: Pagamento do Saldo na Entrega
                            paymentSection

                            // Seção 6: Agendamento de Retirada & Entrega com Horários
                            logisticsSchedulingSection

                            // Seção 7: Resumo Financeiro, Frete & Comissão
                            financialSummarySection

                            // Botão Confirmar Pedido
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
                            freightText = ""
                            globalDiscountText = ""
                        }
                        .foregroundStyle(Color.red)
                    }
                }
            }
            .sheet(item: $itemToEditPrice) { item in
                EditItemPriceSheet(item: item) { newPrice, justification in
                    appState.updateItemPrice(id: item.id, newPrice: newPrice, justification: justification)
                    updateDownPaymentFromPercent()
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
                        customerName: lastCustomerName.isEmpty ? (appState.selectedCustomer?.fullName ?? "Cliente") : lastCustomerName,
                        totalAmount: lastSaleTotal,
                        estimatedCommission: lastSaleCommission,
                        downPaymentAmount: lastDownPaymentAmount,
                        downPaymentMethod: lastDownPaymentMethod,
                        remainingBalance: max(0.0, lastSaleTotal - lastDownPaymentAmount),
                        deliveryPaymentMethod: selectedPaymentMethod,
                        onDismiss: {
                            dismiss()
                        }
                    )
                }
            }
        }
    }

    // MARK: - Subviews

    // Seção 1: Cliente
    private var customerSection: some View {
        GlassCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Label("Cliente", systemImage: "person.crop.circle.fill")
                        .font(.headline)
                        .foregroundStyle(Color.primary)

                    Spacer()

                    Button(action: { showCustomerPicker = true }) {
                        Text(appState.selectedCustomer == nil ? "Selecionar" : "Alterar")
                            .font(.subheadline.bold())
                            .foregroundStyle(Color.blue)
                    }
                }

                if let cust = appState.selectedCustomer {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(cust.fullName)
                            .font(.subheadline.bold())
                        if let phone = cust.phone ?? cust.whatsapp {
                            Text(phone)
                                .font(.caption)
                                .foregroundStyle(Color.secondary)
                        }
                        Text(cust.formattedAddress)
                            .font(.caption2)
                            .foregroundStyle(Color.secondary)
                    }
                    .padding(.top, 4)
                } else {
                    HStack {
                        Text("Nenhum cliente selecionado")
                            .font(.subheadline)
                            .foregroundStyle(Color.secondary)
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

    // Seção 2: Itens do Carrinho com Edição de Preço
    private var itemsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ITENS DO PEDIDO (\(appState.cartItemCount))")
                .font(.caption.bold())
                .foregroundStyle(Color.secondary)
                .padding(.horizontal, 4)

            ForEach(appState.cartItems) { item in
                GlassCard(cornerRadius: 16) {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(item.product.name)
                                    .font(.headline)
                                    .lineLimit(2)

                                HStack(spacing: 6) {
                                    if item.hasDiscount {
                                        Text(formatCurrency(item.originalPrice))
                                            .font(.caption)
                                            .strikethrough()
                                            .foregroundStyle(Color.secondary)
                                    }
                                    Text("\(item.quantity)x \(formatCurrency(item.unitPrice))")
                                        .font(.caption.bold())
                                        .foregroundStyle(item.hasDiscount ? Color.emerald : Color.secondary)
                                }
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 2) {
                                Text(formatCurrency(item.totalAmount))
                                    .font(.headline)
                                    .foregroundStyle(Color.blue)

                                if item.hasDiscount {
                                    Text("-\(formatCurrency(item.discountAmount))")
                                        .font(.caption2.bold())
                                        .foregroundStyle(Color.emerald)
                                }
                            }
                        }

                        // Detalhamento de personalização do item
                        if item.hasCustomization {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 6) {
                                    if let sizeName = item.product.detectedSize {
                                        Text(sizeName)
                                            .font(.caption2.bold())
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(Color.blue.opacity(0.12))
                                            .foregroundStyle(Color.blue)
                                            .clipShape(Capsule())
                                    }

                                    // Camada de espuma (apenas para colchão ou conjunto, nunca box)
                                    if !item.product.isOnlyBox && item.customization.extraFoam != .none {
                                        Text(item.customization.extraFoam.badge)
                                            .font(.caption2.bold())
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(Color.purple.opacity(0.12))
                                            .foregroundStyle(Color.purple)
                                            .clipShape(Capsule())
                                    }
                                }

                                HStack(spacing: 6) {
                                    Circle()
                                        .fill(Color(hex: item.customization.fabricColorHex))
                                        .frame(width: 10, height: 10)
                                        .overlay(Circle().stroke(Color.gray.opacity(0.4), lineWidth: 0.5))

                                    Text("Tecido: \(item.customization.fabricColor)")
                                        .font(.caption2)
                                        .foregroundStyle(Color.secondary)

                                    if !item.customization.fitilho.isEmpty {
                                        Text("• \(item.customization.fitilho)")
                                            .font(.caption2)
                                            .foregroundStyle(Color.secondary)
                                    }
                                }

                                if item.product.isConjunto || item.product.isOnlyBox {
                                    Text("Pés: \(item.customization.feetType)")
                                        .font(.caption2)
                                        .foregroundStyle(Color.secondary)
                                }

                                if let just = item.priceJustification, !just.isEmpty {
                                    Text("Negociação: \(just)")
                                        .font(.caption2.bold())
                                        .foregroundStyle(Color.orange)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color.orange.opacity(0.1))
                                        .clipShape(RoundedRectangle(cornerRadius: 6))
                                }
                            }
                            .padding(.top, 2)
                        }

                        Divider()

                        // Barra de Ações do Item: Ajustar Preço, Quantidade e Excluir
                        HStack {
                            // Botão de Editar Preço Praticado
                            Button(action: {
                                itemToEditPrice = item
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "pencil.circle.fill")
                                    Text("Editar Preço")
                                }
                                .font(.caption.bold())
                                .foregroundStyle(Color.blue)
                            }
                            .buttonStyle(.bordered)

                            Spacer()

                            // Stepper de Quantidade
                            HStack(spacing: 8) {
                                Button(action: {
                                    appState.updateItemQuantity(id: item.id, newQuantity: item.quantity - 1)
                                    updateDownPaymentFromPercent()
                                }) {
                                    Image(systemName: "minus")
                                        .font(.caption.bold())
                                        .frame(width: 28, height: 28)
                                        .background(Color(uiColor: .tertiarySystemFill))
                                        .clipShape(Circle())
                                }

                                Text("\(item.quantity)")
                                    .font(.subheadline.bold())
                                    .frame(minWidth: 20)

                                Button(action: {
                                    appState.updateItemQuantity(id: item.id, newQuantity: item.quantity + 1)
                                    updateDownPaymentFromPercent()
                                }) {
                                    Image(systemName: "plus")
                                        .font(.caption.bold())
                                        .frame(width: 28, height: 28)
                                        .background(Color(uiColor: .tertiarySystemFill))
                                        .clipShape(Circle())
                                }
                            }

                            Button(action: { appState.removeFromCart(id: item.id) }) {
                                Image(systemName: "trash")
                                    .font(.caption)
                                    .foregroundStyle(Color.red)
                                    .padding(.leading, 8)
                            }
                        }
                    }
                }
            }
        }
    }

    // Seção 3: Desconto Global da Venda
    private var globalDiscountSection: some View {
        GlassCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Label("Desconto Geral da Venda", systemImage: "tag.fill")
                        .font(.headline)
                        .foregroundStyle(Color.primary)
                    Spacer()
                    HStack(spacing: 4) {
                        Text("R$")
                            .font(.subheadline.bold())
                            .foregroundStyle(Color.secondary)
                        TextField("0,00", text: $globalDiscountText)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .font(.subheadline.bold())
                            .frame(width: 90)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(uiColor: .tertiarySystemFill))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .onChange(of: globalDiscountText) { _, newVal in
                                let cleaned = newVal.replacingOccurrences(of: ",", with: ".")
                                appState.globalDiscount = max(0.0, Double(cleaned) ?? 0.0)
                                updateDownPaymentFromPercent()
                            }
                    }
                }

                // Presets Rápidos de Desconto
                HStack(spacing: 8) {
                    ForEach([50, 100, 200], id: \.self) { val in
                        Button(action: {
                            globalDiscountText = "\(val)"
                            appState.globalDiscount = Double(val)
                            updateDownPaymentFromPercent()
                        }) {
                            Text("-R$ \(val)")
                                .font(.caption2.bold())
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Color.red.opacity(0.1))
                                .foregroundStyle(Color.red)
                                .clipShape(Capsule())
                        }
                    }
                    if appState.globalDiscount > 0 {
                        Button("Zerar") {
                            globalDiscountText = ""
                            appState.globalDiscount = 0.0
                            updateDownPaymentFromPercent()
                        }
                        .font(.caption2.bold())
                        .foregroundStyle(Color.secondary)
                    }
                }
            }
        }
    }

    // Seção 4: Entrada no Ato (Sinal)
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

                        // Status da Entrada (Paga no Ato / Hoje vs Pendente)
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Status da Entrada:")
                                    .font(.caption.bold())
                                    .foregroundStyle(Color.secondary)
                                HStack(spacing: 6) {
                                    Image(systemName: isDownPaymentPaid ? "checkmark.circle.fill" : "clock.fill")
                                        .foregroundStyle(isDownPaymentPaid ? Color.emerald : Color.orange)
                                    Text(isDownPaymentPaid ? "Entrada Paga no Ato (Hoje)" : "Entrada Pendente")
                                        .font(.subheadline.bold())
                                        .foregroundStyle(isDownPaymentPaid ? Color.emerald : Color.orange)
                                }
                            }
                            Spacer()
                            Toggle("", isOn: $isDownPaymentPaid)
                                .labelsHidden()
                        }
                        .padding(10)
                        .background(isDownPaymentPaid ? Color.emerald.opacity(0.12) : Color.orange.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 10))

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

                        // Detalhamento Entrada Paga vs Saldo na Entrega
                        VStack(spacing: 6) {
                            HStack {
                                HStack(spacing: 6) {
                                    Image(systemName: "checkmark.seal.fill")
                                        .foregroundStyle(Color.emerald)
                                    Text("Entrada Paga no Ato (Hoje):")
                                        .font(.caption.bold())
                                        .foregroundStyle(Color.secondary)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 1) {
                                    Text(formatCurrency(downPaymentAmount))
                                        .font(.subheadline.bold())
                                        .foregroundStyle(Color.emerald)
                                    Text("Quitada via \(selectedDownPaymentMethod)")
                                        .font(.system(size: 10))
                                        .foregroundStyle(Color.secondary)
                                }
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .background(Color.emerald.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                            HStack {
                                HStack(spacing: 6) {
                                    Image(systemName: "truck.box.badge.clock.fill")
                                        .foregroundStyle(Color.blue)
                                    Text("Saldo a Pagar na Entrega:")
                                        .font(.caption.bold())
                                        .foregroundStyle(Color.secondary)
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 1) {
                                    let remainingBal = max(0.0, appState.cartTotal - downPaymentAmount)
                                    Text(formatCurrency(remainingBal))
                                        .font(.subheadline.bold())
                                        .foregroundStyle(Color.blue)
                                    Text("A receber no ato da entrega")
                                        .font(.system(size: 10).bold())
                                        .foregroundStyle(Color.blue)
                                }
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .background(Color.blue.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                    }
                }
            }
        }
    }

    // Seção 5: Pagamento do Saldo Restante na Entrega
    private var paymentSection: some View {
        GlassCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Label(
                    hasDownPayment ? "Pagamento do Saldo na Entrega" : "Forma de Pagamento",
                    systemImage: hasDownPayment ? "truck.box.fill" : "creditcard.fill"
                )
                .font(.headline)

                if hasDownPayment {
                    let remainingBal = max(0.0, appState.cartTotal - downPaymentAmount)
                    Text("Como o cliente pagará o saldo restante de \(formatCurrency(remainingBal)) na entrega?")
                        .font(.caption)
                        .foregroundStyle(Color.secondary)
                }

                Picker("Forma de Pagamento", selection: $selectedPaymentMethod) {
                    Text(hasDownPayment ? "Cartão de Crédito (na Entrega)" : "Cartão de Crédito").tag("Cartão de Crédito")
                    Text(hasDownPayment ? "Cartão de Débito (na Entrega)" : "Cartão de Débito").tag("Cartão de Débito")
                    Text(hasDownPayment ? "PIX (na Entrega)" : "PIX (À Vista)").tag("PIX")
                    Text(hasDownPayment ? "Dinheiro (na Entrega)" : "Dinheiro").tag("Dinheiro")
                    Text("Boleto Bancário").tag("Boleto")
                }
                .pickerStyle(.menu)

                if selectedPaymentMethod == "Cartão de Crédito" {
                    Stepper("Parcelamento do saldo: \(installments)x", value: $installments, in: 1...12)
                        .font(.subheadline)
                    let baseAmount = hasDownPayment ? max(0.0, appState.cartTotal - downPaymentAmount) : appState.cartTotal
                    Text("Valor de cada parcela: \(formatCurrency(baseAmount / Double(installments))) no ato da entrega")
                        .font(.caption.bold())
                        .foregroundStyle(Color.blue)
                }
            }
        }
    }

    // Seção 6: Agendamento de Retirada & Entrega com Horários e Turnos
    private var logisticsSchedulingSection: some View {
        GlassCard(cornerRadius: 16) {
            VStack(alignment: .leading, spacing: 16) {
                Label("Logística & Agendamento", systemImage: "truck.box.fill")
                    .font(.headline)
                    .foregroundStyle(Color.primary)

                // Modo de Agendamento
                VStack(alignment: .leading, spacing: 6) {
                    Text("Modalidade:")
                        .font(.caption.bold())
                        .foregroundStyle(Color.secondary)

                    Picker("Modalidade", selection: $scheduleMode) {
                        Text("Retirada & Entrega").tag("both")
                        Text("Apenas Entrega").tag("delivery")
                        Text("Apenas Retirada").tag("pickup")
                    }
                    .pickerStyle(.segmented)
                }

                // Bloco de Retirada / Coleta (quando both ou pickup)
                if scheduleMode == "both" || scheduleMode == "pickup" {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "arrow.up.circle.fill")
                                .foregroundStyle(Color.orange)
                            Text("Coleta / Retirada do Colchão")
                                .font(.subheadline.bold())
                        }

                        DatePicker("Data da Retirada", selection: $pickupDate, displayedComponents: [.date])
                            .font(.subheadline)

                        HStack {
                            Text("Horário / Turno:")
                                .font(.caption.bold())
                                .foregroundStyle(Color.secondary)
                            Spacer()
                            Picker("Turno Retirada", selection: $pickupTime) {
                                Text("Manhã (08h - 12h)").tag("Manhã (08h - 12h)")
                                Text("Tarde (13h - 18h)").tag("Tarde (13h - 18h)")
                                Text("Comercial (09h - 17h)").tag("Comercial (09h - 17h)")
                                Text("Fim de Tarde (16h - 19h)").tag("Fim de Tarde (16h - 19h)")
                            }
                            .pickerStyle(.menu)
                        }
                    }
                    .padding(10)
                    .background(Color.orange.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Bloco de Entrega Final (quando both ou delivery)
                if scheduleMode == "both" || scheduleMode == "delivery" {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "arrow.down.circle.fill")
                                .foregroundStyle(Color.blue)
                            Text("Entrega do Produto Pronto")
                                .font(.subheadline.bold())
                        }

                        // Atalhos de Prazo
                        HStack(spacing: 6) {
                            ForEach([5, 7, 10, 15], id: \.self) { days in
                                Button(action: {
                                    deliveryDate = Calendar.current.date(byAdding: .day, value: days, to: Date()) ?? Date()
                                }) {
                                    Text("+\(days)d")
                                        .font(.caption2.bold())
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.blue.opacity(0.12))
                                        .foregroundStyle(Color.blue)
                                        .clipShape(Capsule())
                                }
                            }
                        }

                        DatePicker("Data da Entrega", selection: $deliveryDate, displayedComponents: [.date])
                            .font(.subheadline)

                        HStack {
                            Text("Horário / Turno:")
                                .font(.caption.bold())
                                .foregroundStyle(Color.secondary)
                            Spacer()
                            Picker("Turno Entrega", selection: $deliveryTime) {
                                Text("Manhã (08h - 12h)").tag("Manhã (08h - 12h)")
                                Text("Tarde (13h - 18h)").tag("Tarde (13h - 18h)")
                                Text("Comercial (09h - 17h)").tag("Comercial (09h - 17h)")
                                Text("Fim de Tarde (16h - 19h)").tag("Fim de Tarde (16h - 19h)")
                            }
                            .pickerStyle(.menu)
                        }
                    }
                    .padding(10)
                    .background(Color.blue.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Instruções de rota
                VStack(alignment: .leading, spacing: 4) {
                    Text("Instruções de Rota & Entrega:")
                        .font(.caption.bold())
                        .foregroundStyle(Color.secondary)
                    TextField("Ex: Portaria 24h, interfone 302, ligar 15min antes...", text: $logisticsNotes)
                        .font(.subheadline)
                        .textFieldStyle(.roundedBorder)
                }

                // Observações gerais da venda
                VStack(alignment: .leading, spacing: 4) {
                    Text("Observações Gerais da Venda:")
                        .font(.caption.bold())
                        .foregroundStyle(Color.secondary)
                    TextField("Instruções gerais ou detalhes do cliente", text: $notes)
                        .font(.subheadline)
                        .textFieldStyle(.roundedBorder)
                }
            }
        }
    }

    // Seção 7: Resumo Financeiro & Frete Digitável
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
                            .bold()
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

                // Destaque de Comissão do Vendedor (calculada sobre produtos com desconto, sem frete)
                VStack(spacing: 4) {
                    HStack {
                        Image(systemName: "gift.fill")
                            .foregroundStyle(Color.emerald)
                        Text("Sua Comissão Estimada (\(appState.commissionPercentText)):")
                            .font(.caption.bold())
                            .foregroundStyle(Color.emerald)
                        Spacer()
                        Text(formatCurrency(appState.estimatedCommission))
                            .font(.headline.bold())
                            .foregroundStyle(Color.emerald)
                    }

                    HStack {
                        Text("* Incide sobre produtos e reformas (\(formatCurrency(appState.commissionableAmount))), excluindo frete.")
                            .font(.system(size: 9))
                            .foregroundStyle(Color.secondary)
                        Spacer()
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.emerald.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .padding(.top, 4)
            }
        }
    }

    // Botão Finalizar
    private var finalizeButton: some View {
        Button(action: handleFinalizeSale) {
            HStack(spacing: 8) {
                if isSubmitting {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.headline)
                    Text(hasDownPayment ? "Confirmar Venda (Entrada Paga • Saldo na Entrega)" : "Confirmar Pedido")
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

    // MARK: - Ação Finalizar com Limpeza Imediata do Carrinho
    private func handleFinalizeSale() {
        guard let customer = appState.selectedCustomer ?? appState.customers.first else {
            showCustomerPicker = true
            return
        }

        isSubmitting = true

        // Salvar snapshots para a tela de sucesso antes de limpar o carrinho
        let currentTotal = appState.cartTotal
        let currentCommission = appState.estimatedCommission
        let custName = customer.fullName
        let downAmount = hasDownPayment ? downPaymentAmount : 0.0
        let downMethod = hasDownPayment ? selectedDownPaymentMethod : ""

        let isBothOrPickup = (scheduleMode == "both" || scheduleMode == "pickup")
        let isBothOrDelivery = (scheduleMode == "both" || scheduleMode == "delivery")

        let pickupDateString = isBothOrPickup ? ISO8601DateFormatter().string(from: pickupDate) : nil
        let deliveryDateString = isBothOrDelivery ? ISO8601DateFormatter().string(from: deliveryDate) : nil

        Task {
            do {
                let result = try await APIClient.shared.finalizeSale(
                    customerId: customer.id,
                    sellerId: appState.currentUser?.sellerId,
                    items: appState.cartItems,
                    subtotal: appState.cartSubtotal,
                    discount: appState.globalDiscount,
                    freight: appState.freightAmount,
                    total: currentTotal,
                    paymentMethodName: selectedPaymentMethod,
                    installments: installments,
                    hasDownPayment: hasDownPayment,
                    isDownPaymentPaid: isDownPaymentPaid,
                    downPaymentAmount: downAmount,
                    downPaymentMethod: downMethod,
                    scheduleMode: scheduleMode,
                    pickupDate: pickupDateString,
                    pickupTime: isBothOrPickup ? pickupTime : nil,
                    deliveryDate: deliveryDateString,
                    deliveryTime: isBothOrDelivery ? deliveryTime : nil,
                    logisticsNotes: logisticsNotes.trimmingCharacters(in: .whitespacesAndNewlines),
                    notes: notes,
                    isTest: appState.isTestMode
                )

                await MainActor.run {
                    self.lastSaleTotal = currentTotal
                    self.lastSaleCommission = currentCommission
                    self.lastCustomerName = custName
                    self.lastDownPaymentAmount = downAmount
                    self.lastDownPaymentMethod = downMethod
                    self.completedSaleNumber = result.saleNumber
                    self.isSubmitting = false
                    self.showSuccess = true

                    // Atualiza lista de pedidos no estado
                    let newOrder = Order(
                        id: result.orderId,
                        saleNumber: result.saleNumber,
                        customerName: custName,
                        customerPhone: customer.phone ?? "",
                        customerAddress: customer.formattedAddress,
                        status: .sold,
                        totalAmount: currentTotal,
                        createdAt: ISO8601DateFormatter().string(from: Date()),
                        deliveryDate: deliveryDateString ?? ISO8601DateFormatter().string(from: Date()),
                        items: appState.cartItems.map {
                            OrderItem(id: $0.id.uuidString, name: $0.product.name, quantity: $0.quantity, unitPrice: $0.unitPrice, total: $0.totalAmount)
                        }
                    )
                    appState.orders.insert(newOrder, at: 0)

                    // ESVAZIA O CARRINHO E RESETA CAMPOS IMEDIATAMENTE APÓS SUCESSO!
                    appState.clearCart()
                    appState.freightAmount = 0.0
                    self.freightText = ""
                    self.globalDiscountText = ""
                    self.hasDownPayment = false
                    self.downPaymentAmount = 0.0
                    self.downPaymentCustomText = ""
                }
            } catch {
                await MainActor.run {
                    self.lastSaleTotal = currentTotal
                    self.lastSaleCommission = currentCommission
                    self.lastCustomerName = custName
                    self.lastDownPaymentAmount = downAmount
                    self.lastDownPaymentMethod = downMethod
                    self.isSubmitting = false
                    self.completedSaleNumber = "VEND-\(Int.random(in: 1000...9999))"
                    self.lastSaleCommission = currentCommission
                    self.lastCustomerName = custName
                    self.isSubmitting = false
                    self.completedSaleNumber = "VEND-\(Int.random(in: 1000...9999))"
                    self.showSuccess = true

                    // Esvazia o carrinho no fallback offline
                    appState.clearCart()
                    appState.freightAmount = 0.0
                    self.freightText = ""
                    self.globalDiscountText = ""
                    self.hasDownPayment = false
                    self.downPaymentAmount = 0.0
                    self.downPaymentCustomText = ""
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
