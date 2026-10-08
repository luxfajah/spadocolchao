// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SpaVendedor",
    defaultLocalization: "pt-BR",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "SpaVendedorCore",
            targets: ["SpaVendedorCore"]
        )
    ],
    targets: [
        .target(
            name: "SpaVendedorCore",
            path: "SpaVendedor"
        )
    ]
)
