import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-8">
          <div className="max-w-md rounded-2xl border bg-white p-8 shadow-sm text-center">
            <div className="text-4xl mb-4">!</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Bir hata oluştu</h2>
            <p className="text-sm text-gray-500 mb-6">
              Sayfa yüklenirken beklenmeyen bir sorun oluştu. Lütfen sayfayı yenileyin.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-black/90"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
