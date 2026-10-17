import { useEffect, type RefObject } from 'react'

const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function useDialogBehavior(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null

    function focusable() {
      if (!panel) return []
      return [...panel.querySelectorAll<HTMLElement>(focusableSelector)].filter(
        (element) => !element.hasAttribute('disabled'),
      )
    }

    focusable()[0]?.focus()

    function onKey(event: KeyboardEvent) {
      const dialogs = document.querySelectorAll('[role="dialog"]')
      const top = dialogs[dialogs.length - 1]
      if (panel && top !== panel) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previously?.focus()
    }
  }, [open, onClose, panelRef])
}
