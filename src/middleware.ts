import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("spa_session")?.value
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)

  const userAgent = request.headers.get("user-agent") || ""
  const isVendedorApp = userAgent.includes("CapacitorVendedor")
  const isEntregadorApp = userAgent.includes("CapacitorEntregador")

  if (isVendedorApp && !request.nextUrl.pathname.startsWith("/app-vendedor") && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/app-vendedor/pdv", request.url))
  }

  if (isEntregadorApp && !request.nextUrl.pathname.startsWith("/app-entregador") && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/app-entregador/pedidos", request.url))
  }

  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url)
    if (request.nextUrl.pathname !== "/" && request.nextUrl.pathname !== "/login") {
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif)$).*)"],
}
