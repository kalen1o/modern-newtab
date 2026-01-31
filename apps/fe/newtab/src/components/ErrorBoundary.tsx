import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  appName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    console.error(
      `ErrorBoundary caught an error for ${this.props.appName || "unknown component"}:`,
      error
    )
    console.error("Error info:", errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center px-8 py-8 bg-red-500/10 border border-red-500/30 rounded-lg mx-4">
          <div className="text-center">
            <h3 className="m-0 mb-4 text-xl font-semibold text-red-400">
              {this.props.appName ? `${this.props.appName} Failed to Load` : "Component Error"}
            </h3>
            <p className="m-0 mb-6 text-sm text-red-400/80">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              type="button"
              className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg cursor-pointer text-sm transition-all hover:bg-red-500/30 hover:border-red-500/50"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
