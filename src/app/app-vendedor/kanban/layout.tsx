"use client"

import { useEffect } from "react"

export default function KanbanLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Try to lock orientation to landscape via Screen Orientation API
    const lockOrientation = async () => {
      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape')
        }
      } catch (e) {
        // Orientation lock not supported or not in fullscreen — fallback handled by CSS
        console.log('Orientation lock not available, using CSS fallback')
      }
    }

    lockOrientation()

    // Hide the bottom nav bar when kanban is mounted
    const nav = document.querySelector('nav.fixed.bottom-0') as HTMLElement
    if (nav) nav.style.display = 'none'

    // Hide the main padding
    const main = document.querySelector('main.flex-1') as HTMLElement
    if (main) {
      main.style.paddingBottom = '0'
      main.style.overflow = 'hidden'
    }

    return () => {
      // Restore nav and unlock orientation on unmount
      if (nav) nav.style.display = ''
      if (main) {
        main.style.paddingBottom = ''
        main.style.overflow = ''
      }
      try {
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock()
        }
      } catch (e) { /* ignore */ }
    }
  }, [])

  return (
    <div className="kanban-landscape-wrapper">
      {children}
    </div>
  )
}
