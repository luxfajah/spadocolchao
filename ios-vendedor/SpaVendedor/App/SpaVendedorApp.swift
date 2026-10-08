import SwiftUI

@main
struct SpaVendedorApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView(appState: appState)
                .environment(appState)
                .preferredColorScheme(.light)
        }
    }
}
