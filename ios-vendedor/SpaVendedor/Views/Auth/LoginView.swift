import SwiftUI

public struct LoginView: View {
    @Environment(AppState.self) private var appState

    @State private var username = "carlos.vendas"
    @State private var password = ""
    @State private var isAuthenticating = false
    @State private var errorMessage: String? = nil
    @State private var showServerConfig = false
    @State private var customServerURL = APIClient.shared.baseURLString

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                // Background Gradient
                LinearGradient(
                    colors: [
                        Color(red: 15/255, green: 23/255, blue: 42/255), // Slate 900
                        Color(red: 30/255, green: 58/255, blue: 138/255), // Blue 900
                        Color(red: 15/255, green: 23/255, blue: 42/255)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 28) {
                        Spacer(minLength: 40)

                        // Branding
                        VStack(spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 24, style: .continuous)
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.blue, Color(red: 37/255, green: 99/255, blue: 235/255)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 84, height: 84)
                                    .shadow(color: Color.blue.opacity(0.4), radius: 16, x: 0, y: 8)

                                Image(systemName: "bed.double.fill")
                                    .font(.system(size: 38))
                                    .foregroundStyle(.white)
                            }

                            Text("Spa do Colchão")
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)

                            Text("Módulo Comercial & PDV Mobile")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(Color.white.opacity(0.7))
                        }

                        // Form Container
                        VStack(spacing: 16) {
                            // Usuário
                            VStack(alignment: .leading, spacing: 6) {
                                Text("USUÁRIO OU E-MAIL")
                                    .font(.caption2.bold())
                                    .foregroundStyle(Color.white.opacity(0.6))

                                HStack {
                                    Image(systemName: "person.fill")
                                        .foregroundStyle(Color.white.opacity(0.5))
                                    TextField("Seu usuário", text: $username)
                                        .textContentType(.username)
                                        .autocapitalization(.none)
                                        .foregroundStyle(.white)
                                }
                                .padding()
                                .background(Color.white.opacity(0.08))
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                                )
                            }

                            // Senha
                            VStack(alignment: .leading, spacing: 6) {
                                Text("SENHA DE ACESSO")
                                    .font(.caption2.bold())
                                    .foregroundStyle(Color.white.opacity(0.6))

                                HStack {
                                    Image(systemName: "lock.fill")
                                        .foregroundStyle(Color.white.opacity(0.5))
                                    SecureField("Sua senha", text: $password)
                                        .textContentType(.password)
                                        .foregroundStyle(.white)
                                }
                                .padding()
                                .background(Color.white.opacity(0.08))
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                                )
                            }

                            if let errorMessage = errorMessage {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                    Text(errorMessage)
                                        .font(.caption)
                                }
                                .foregroundStyle(.red)
                                .padding(.vertical, 4)
                            }

                            // Botão Entrar
                            Button(action: handleLogin) {
                                HStack(spacing: 8) {
                                    if isAuthenticating {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Text("Entrar no Sistema")
                                            .font(.headline)
                                        Image(systemName: "arrow.right")
                                            .font(.headline)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 52)
                                .background(
                                    LinearGradient(
                                        colors: [Color.blue, Color(red: 29/255, green: 78/255, blue: 216/255)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .shadow(color: Color.blue.opacity(0.4), radius: 10, x: 0, y: 5)
                            }
                            .disabled(isAuthenticating)
                            .padding(.top, 6)

                            // Biometria (Face ID / Touch ID)
                            if BiometricManager.shared.canEvaluateBiometrics {
                                Button(action: handleBiometrics) {
                                    HStack(spacing: 8) {
                                        Image(systemName: "faceid")
                                            .font(.title3)
                                        Text("Acessar com \(BiometricManager.shared.biometricTypeString)")
                                            .font(.subheadline.bold())
                                    }
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 48)
                                    .background(Color.white.opacity(0.1))
                                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                }
                            }

                            // Modo Demo
                            Button(action: enterDemoMode) {
                                Text("Acessar em Modo Demonstração")
                                    .font(.subheadline)
                                    .foregroundStyle(Color.white.opacity(0.7))
                                    .underline()
                            }
                            .padding(.top, 4)
                        }
                        .padding(24)
                        .background(.ultraThinMaterial.opacity(0.35))
                        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 24, style: .continuous)
                                .stroke(Color.white.opacity(0.15), lineWidth: 1)
                        )
                        .padding(.horizontal, 20)

                        // Servidor Config Button
                        Button(action: { showServerConfig = true }) {
                            HStack(spacing: 4) {
                                Image(systemName: "network")
                                Text("Servidor: \(customServerURL.replacingOccurrences(of: "https://", with: ""))")
                            }
                            .font(.caption2)
                            .foregroundStyle(Color.white.opacity(0.5))
                        }

                        Spacer(minLength: 40)
                    }
                }
            }
            .sheet(isPresented: $showServerConfig) {
                NavigationStack {
                    Form {
                        Section("Endereço da API") {
                            TextField("URL do Servidor", text: $customServerURL)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }
                        Section {
                            Button("Salvar Servidor") {
                                APIClient.shared.baseURLString = customServerURL
                                showServerConfig = false
                            }
                            Button("Restaurar Padrão (Vercel)") {
                                customServerURL = "https://spadocolchao.vercel.app"
                                APIClient.shared.baseURLString = customServerURL
                                showServerConfig = false
                            }
                            .foregroundStyle(.secondary)
                        }
                    }
                    .navigationTitle("Configuração do Servidor")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Fechar") { showServerConfig = false }
                        }
                    }
                }
            }
        }
    }

    private func handleLogin() {
        guard !username.isEmpty else {
            errorMessage = "Digite seu usuário ou e-mail"
            return
        }

        isAuthenticating = true
        errorMessage = nil

        Task {
            do {
                let user = try await APIClient.shared.login(username: username, password: password)
                await MainActor.run {
                    appState.setUser(user)
                    isAuthenticating = false
                }
            } catch {
                await MainActor.run {
                    isAuthenticating = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }

    private func handleBiometrics() {
        Task {
            let success = await BiometricManager.shared.authenticate(reason: "Acesse o PDV Spa do Colchão")
            if success {
                await MainActor.run {
                    appState.setUser(User.demo)
                }
            }
        }
    }

    private func enterDemoMode() {
        appState.setUser(User.demo)
    }
}
