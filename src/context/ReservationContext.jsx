import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'locafacil_reservation'

const ReservationContext = createContext(null)

function loadInitialState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function ReservationProvider({ children }) {
  const [state, setState] = useState(loadInitialState)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // sessionStorage indisponível (modo privado, etc.) — segue sem persistir
    }
  }, [state])

  const patch = (partial) => setState((prev) => ({ ...prev, ...partial }))

  const reset = () => {
    setState({})
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return (
    <ReservationContext.Provider value={{ ...state, patch, reset }}>
      {children}
    </ReservationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReservation() {
  const ctx = useContext(ReservationContext)
  if (!ctx) {
    throw new Error('useReservation deve ser usado dentro de ReservationProvider')
  }
  return ctx
}
