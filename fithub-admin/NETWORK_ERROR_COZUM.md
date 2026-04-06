# "Network Error" / Bağlantı Hatası Çözümü

Frontend (localhost) mesaj gönderirken veya API çağrısı yaparken **Network Error** alıyorsan, genelde aşağıdakilerden biri vardır.

---

## 1. Backend adresi doğru mu?

- Projede kullanılan adres: **`fithub-admin/.env`** içindeki `VITE_API_BASE_URL`
- Şu an: `https://fithub-backend-jd40.onrender.com` (veya .env’de ne yazıyorsa o)
- Backend farklı bir adreste (farklı Render servisi, kendi sunucun) çalışıyorsa `.env`’i ona göre güncelle, **dev server’ı yeniden başlat** (Ctrl+C sonra `npm run dev`).

---

## 2. Backend çalışıyor mu?

- **Render** kullanıyorsan: Ücretsiz planda uygulama bir süre istek almazsa **uykuya geçer**. İlk istek 30–60 saniye sürebilir (cold start). Tarayıcıda doğrudan backend adresini aç: `https://fithub-backend-jd40.onrender.com` — sayfa açılıyor mu / 404/502 mi bak.
- Backend **kendi bilgisayarında** çalışıyorsa: `.env`’de `VITE_API_BASE_URL=http://127.0.0.1:8000` (veya backend’in portu) olmalı ve backend gerçekten ayakta olmalı.

---

## 3. CORS (en sık sebep)

Frontend **http://localhost:5173** (veya başka bir origin) üzerinde çalışıyor, backend farklı bir domain’de (örn. Render). Tarayıcı, backend’in “bu origin’den isteklere izin ver” demesini bekler; demezse isteği keser ve **Network Error** gibi görünür.

**Backend’de yapılması gereken:**

- CORS ayarlarında **frontend origin’ini** izinli listeye eklemek:
  - Geliştirme: `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173` (kullandığın adresler)
  - Production: Admin paneli nerede yayındaysa o domain (örn. `https://admin.fithub.com`)
- Örnek (FastAPI):
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- Django / Express / vs. için de benzer şekilde CORS’ta `allow_origins` veya eşdeğeri ile bu adresleri eklemek gerekir.

Backend’i güncelledikten sonra tekrar dene; hata devam ederse tarayıcıda **F12 → Network** sekmesinden başarısız isteğe tıklayıp **CORS** veya **blocked** ile ilgili uyarı var mı bak.

---

## 4. Hızlı kontrol listesi

| Kontrol | Ne yapmalı |
|--------|-------------|
| .env | `VITE_API_BASE_URL` doğru mu? Değiştirdiysen `npm run dev` yeniden başlatıldı mı? |
| Backend ayakta mı? | Tarayıcıda backend URL’ini aç (Root veya /docs); sayfa / JSON geliyor mu? |
| CORS | Backend’de frontend origin’i (localhost:5173 vb.) CORS’ta izinli mi? |
| F12 → Network | İstek “failed” veya “blocked” görünüyor mu? Detayına tıklayıp sebebini oku. |

Hata mesajında artık **hangi adrese istek atıldığı** da yazıyor; o adresi yukarıdaki adımlarla kontrol et.
