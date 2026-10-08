import SwiftUI

public struct ProfileView: View {
    @Environment(AppState.self) private var appState

    @State private var showLogoutConfirmation = false
    @State private var serverURL = APIClient.shared.baseURLString
    @State private var showServerEditor = false

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        BrandHeader(
                            title: "Perfil do Vendedor",
                            subtitle: "Configurações da Conta",
                            isOffline: appState.isOfflineMode
                        )
                        .padding(.horizontal)
                        .padding(.top, 8)

                        // Card do Vendedor
                        GlassCard(cornerRadius: 24) {
                            VStack(spacing: 16) {
                                ZStack {
                                    Circle()
                                        .fill(
                                            LinearGradient(
                                                colors: [Color.blue, Color(red: 29/255, green: 78/255, blue: 216/255)],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            )
                                        )
                                        .frame(width: 80, height: 80)

                                    Text(initials(for: appState.currentUser?.name ?? "Vendedor"))
                                        .font(.system(size: 28, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                }

                                VStack(spacing: 4) {
                                    Text(appState.currentUser?.name ?? "Carlos Vendedor")
                                        .font(.title3.bold())

                                    Text(appState.currentUser?.email ?? "vendas@spadocolchao.com.br")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                Divider()

                                HStack(spacing: 20) {
                                    VStack(spacing: 2) {
                                        Text("CÓDIGO")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundStyle(.secondary)
                                        Text(appState.currentUser?.sellerCode ?? "VD-01")
                                            .font(.subheadline.bold())
                                    }

                                    Spacer()

                                    VStack(spacing: 2) {
                                        Text("COMISSÃO BASE")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundStyle(.secondary)
                                        let pct = Int((appState.currentUser?.commissionRate ?? 0.05) * 100)
                                        Text("\(pct)%")
                                            .font(.subheadline.bold())
                                            .foregroundStyle(Color.emerald)
                                    }

                                    Spacer()

                                    VStack(spacing: 2) {
                                        Text("PERFIL")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundStyle(.secondary)
                                        Text(appState.currentUser?.role ?? "VENDEDOR")
                                            .font(.subheadline.bold())
                                            .foregroundStyle(Color.blue)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)

                        // Servidor e Sincronização
                        GlassCard(cornerRadius: 18) {
                            VStack(alignment: .leading, spacing: 14) {
                                Text("CONEXÃO & SINCRONIZAÇÃO")
                                    .font(.caption.bold())
                                    .foregroundStyle(.secondary)

                                HStack {
                                    Image(systemName: "server.rack")
                                        .foregroundStyle(.blue)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Servidor de Dados")
                                            .font(.subheadline.bold())
                                        Text(serverURL)
                                            .font(.caption2)
                                            .foregroundStyle(.secondary)
                                            .lineLimit(1)
                                    }
                                    Spacer()
                                    Button("Alterar") {
                                        showServerEditor = true
                                    }
                                    .font(.caption.bold())
                                    .buttonStyle(.bordered)
                                }

                                Divider()

                                Button(action: {
                                    Task {
                                        await appState.loadData()
                                    }
                                }) {
                                    HStack {
                                        Image(systemName: "arrow.triangle.2.circlepath")
                                        Text("Sincronizar Dados Agora")
                                    }
                                    .font(.subheadline.bold())
                                    .foregroundStyle(.blue)
                                }
                            }
                        }
                        .padding(.horizontal)

                        // Sobre o App
                        GlassCard(cornerRadius: 18) {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("SOBRE O APLICATIVO")
                                    .font(.caption.bold())
                                    .foregroundStyle(.secondary)

                                HStack {
                                    Text("Versão")
                                    Spacer()
                                    Text("1.0.0 (Native Swift 6)")
                                        .foregroundStyle(.secondary)
                                }
                                .font(.subheadline)

                                HStack {
                                    Text("Plataforma")
                                    Spacer()
                                    Text("iOS 17+ SwiftUI")
                                        .foregroundStyle(.secondary)
                                }
                                .font(.subheadline)
                            }
                        }
                        .padding(.horizontal)

                        // Botão Sair
                        Button(action: { showLogoutConfirmation = true }) {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("Sair da Conta")
                            }
                            .font(.headline)
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.red.opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .padding(.horizontal)
                        .padding(.top, 8)
                        .padding(.bottom, 24)
                    }
                }
            }
            .navigationBarHidden(true)
            .confirmationDialog("Deseja realmente sair?", isPresented: $showLogoutConfirmation, titleVisibility: .visible) {
                Button("Sair", role: .destructive) {
                    appState.logout()
                }
                Button("Cancelar", role: .cancel) {}
            }
            .sheet(isPresented: $showServerEditor) {
                NavigationStack {
                    Form {
                        Section("URL da API") {
                            TextField("https://spadocolchao.vercel.app", text: $serverURL)
                                .autocapitalization(.none)
                        }
                        Section {
                            Button("Salvar") {
                                APIClient.shared.baseURLString = serverURL
                                showServerEditor = false
                            }
                            Button("Restaurar Padrão (Vercel)") {
                                serverURL = "https://spadocolchao.vercel.app"
                                APIClient.shared.baseURLString = serverURL
                                showServerEditor = false
                            }
                            .foregroundStyle(.secondary)
                        }
                    }
                    .navigationTitle("Alterar Servidor")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Fechar") { showServerEditor = false }
                        }
                    }
                }
            }
        }
    }

    private func initials(for name: String) -> String {
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return String(name.prefix(2)).uppercased()
    }
}
