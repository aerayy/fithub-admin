// Centralized error → Turkish user message translator.
//
// Use in catch blocks instead of console.error alone:
//
//   try {
//     await api.post(...)
//   } catch (e) {
//     showToast(translateError(e), "error");
//   }
//
// Or with the helper:
//
//   try { ... } catch (e) { handleError(e, showToast); }

const STATUS_MESSAGES = {
  400: "Geçersiz istek. Bilgileri kontrol edip tekrar deneyin.",
  401: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
  403: "Bu işlem için yetkiniz yok.",
  404: "İstediğiniz bilgi bulunamadı.",
  409: "Bu kayıt zaten mevcut.",
  422: "Girilen bilgiler doğrulanamadı.",
  429: "Çok fazla istek gönderildi. Biraz sonra tekrar deneyin.",
  500: "Sunucu hatası. Lütfen birkaç dakika sonra tekrar deneyin.",
  502: "Sunucu yanıt vermiyor. Lütfen tekrar deneyin.",
  503: "Servis geçici olarak kullanılamıyor.",
  504: "Sunucu zaman aşımına uğradı. Tekrar deneyin.",
};

/**
 * Convert any thrown error (axios, native Error, string) to a friendly
 * Turkish message. Never returns raw URLs, status codes, or stack traces.
 */
export function translateError(err) {
  if (!err) return "Bilinmeyen bir hata oluştu.";

  // Axios error has .response (server reached) or .request (no response)
  if (err.isAxiosError || err.response || err.request) {
    // 1) Server returned a structured error body — prefer its message
    const data = err.response?.data;
    if (data) {
      // FastAPI: { detail: "..." } or { detail: [{msg: "..."}] }
      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
      }
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        const first = data.detail[0];
        if (first?.msg) return first.msg;
      }
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
    }

    // 2) HTTP status code → mapped message
    const status = err.response?.status;
    if (status && STATUS_MESSAGES[status]) {
      return STATUS_MESSAGES[status];
    }
    if (status && status >= 500) {
      return "Sunucu hatası. Lütfen birkaç dakika sonra tekrar deneyin.";
    }
    if (status && status >= 400) {
      return "İstek başarısız oldu. Lütfen tekrar deneyin.";
    }

    // 3) No response from server (network failure, timeout, CORS)
    if (err.code === "ECONNABORTED" || /timeout/i.test(err.message || "")) {
      return "İşlem zaman aşımına uğradı. Tekrar deneyin.";
    }
    if (err.code === "ERR_NETWORK" || /network error/i.test(err.message || "")) {
      return "İnternet bağlantınızı kontrol edin.";
    }
    return "Sunucuya ulaşılamadı. Lütfen tekrar deneyin.";
  }

  // Native Error or thrown string
  if (typeof err === "string" && err.trim()) return err;
  if (err.message && typeof err.message === "string") {
    // Sanitize: never expose URLs or status codes from raw error.message
    if (/https?:\/\//i.test(err.message) || /status code/i.test(err.message)) {
      return "Bir hata oluştu. Lütfen tekrar deneyin.";
    }
    return err.message;
  }

  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}

/**
 * One-liner: catch + log + toast. Use in async handlers when you need
 * both console logging (for devs) and user feedback (for the user).
 *
 *   try { ... } catch (e) { handleError(e, showToast); }
 */
export function handleError(err, showToast, contextLabel = "") {
  if (typeof console !== "undefined" && console.error) {
    if (contextLabel) {
      console.error(`[${contextLabel}]`, err);
    } else {
      console.error(err);
    }
  }
  if (typeof showToast === "function") {
    showToast(translateError(err), "error");
  }
}
