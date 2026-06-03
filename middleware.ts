import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("spa_session")?.value
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)

  const userAgent = (request.headers.get("user-agent") || "").toLowerCase()
  const isVendedorApp = userAgent.includes("capacitorvendedor")
  const isEntregadorApp = userAgent.includes("capacitorentregador")
  const isPontoApp = userAgent.includes("capacitorponto")

  if (isVendedorApp && !request.nextUrl.pathname.startsWith("/app-vendedor") && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/app-vendedor/pdv", request.url))
  }

  if (isEntregadorApp && !request.nextUrl.pathname.startsWith("/app-entregador") && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/app-entregador", request.url))
  }

  if (isPontoApp && !request.nextUrl.pathname.startsWith("/app-ponto") && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/app-ponto", request.url))
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
