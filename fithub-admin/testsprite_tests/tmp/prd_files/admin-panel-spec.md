# FithubPoint Admin Panel — Product Specification

## Overview

FithubPoint admin panel, fitness koçlarının öğrencilerini yönettiği bir web uygulamasıdır. Türkçe arayüz. React 19 + Vite + Tailwind CSS + axios.

**Repo**: https://github.com/aerayy/fithub-admin
**Production URL**: https://fithub-admin-nwtg.onrender.com
**Local dev**: http://localhost:5173

## User Types

1. **Coach** — Kendi öğrencilerini görür, programlarını yönetir, mesajlaşır
2. **Superadmin** — Tüm koçları + öğrencileri yönetir (sadece bizim hesap)

## Test Credentials

```
Coach 1: elif.demir@fithub.demo / FitHub2026Demo!
Coach 2: kaan.yildiz@fithub.demo / FitHub2026Demo!
Coach 3: selin.aydin@fithub.demo / FitHub2026Demo!
```

Demo öğrenciler (DB'de hazır, koçlara atanmış):
- buse.celik@fithub.demo (Elif'in öğrencisi)
- deniz.korkmaz@fithub.demo (Kaan'ın öğrencisi)

## Critical User Flows

### 1. Authentication
- `/login` — email + password formu
- Boş submit → validation error gösterir
- Yanlış credential → "Geçersiz email veya şifre" tarzı hata
- Doğru credential → `/dashboard` yönlendirme + auth token storage
- Logout → token temizlenir, `/login` döner

### 2. Dashboard
- Coach login sonrası dashboard yüklenir
- KPI kartları: aktif öğrenci sayısı, bekleyen mesajlar, vs.
- "Recent Purchases" listesi
- Sidebar navigation: Dashboard, Öğrenciler, Mesajlar, Profil

### 3. Student List
- `/students` — öğrenci kartları grid layout
- Her kart: foto, isim, son aktivite
- Tıklayınca `/students/:id` detay sayfası

### 4. Student Detail (4 Tab)
Tab'lar: **Genel Bakış / Programlar / Öğün Fotoğrafları / Form Analizi**

> NOT: "Mesajlar" tab'ı YOKTUR (kaldırıldı, sidebar'da var)

#### Genel Bakış Tab
Onboarding bilgileri Türkçe gösterilmeli:
- Cinsiyet: "Kadın" / "Erkek" (Female/Male değil)
- Hedef: "Kas Geliştir" (gain_muscle değil)
- Deneyim: "Başlangıç seviyesi" (beginner değil)
- Vücut tipi: "Endomorf" / "Mezomorf" / "Ektomorf"
- Antrenman süresi: "Orta" / "Kısa" / "Uzun"
- Beslenme bütçesi: "Düşük" / "Orta" / "Yüksek"
- Tercih edilen günler: ["Pazartesi", "Çarşamba", ...]

Kaldırılan alanlar (görünmemeli):
- Diz ağrısı
- Supplement kullanımı

#### Programlar Tab
- "AI ile Üret" butonu → backend'e POST, ~30 saniye yükleme
- Üretilen workout program günlere göre listelenir
- Draft sistemi: max 3 draft tab'ı + bir aktif program

#### Öğün Fotoğrafları Tab
- Öğrencinin yüklediği yemek fotoğrafları grid
- Fotoğrafa tıklayınca büyütülür

#### Form Analizi Tab
- 4 açıdan vücut formu fotoğrafları (ön, arka, sağ, sol)
- Tıklayınca büyük modal

### 5. Messages
- `/messages` — sidebar üzerinden açılır
- Conversation listesi sol panel
- Conversation seçince sağ panel chat görünümü açılır
- Mesaj input + send button
- "Çevrimiçi/Çevrimdışı" status YAZMAMALI (kaldırıldı, fake'ti)

### 6. My Profile
- `/profile` — koç kendi profilini düzenler
- Bio, sosyal media linkleri, paketler, profil fotoğrafı
- Referans kodu kartı (kopyala butonu)

## UX Standards

- **Türkçe karakter rendering**: ç, ş, ğ, ü, ö, ı, İ doğru gözükmeli
- **Theme**: Light tema, teal accent (#3E9E8E)
- **Toast bildirimleri**: success/error mesajları üstten slide-in
- **Loading states**: Skeleton veya spinner her async işlemde
- **Error handling**: Network error → kullanıcı dostu mesaj, raw e.message ASLA gösterilmemeli

## Subscription Logic Constraints (kritik bug fix)

- Bir öğrencinin **maksimum 1 aktif aboneliği** olabilir (DB constraint)
- Aktif sub varken yeni paket alımı backend tarafından **409 Conflict** ile reject edilir
- Cancel → expired/canceled state → yeni paket alınabilir

## Skip / Not in Scope

- Multi-language (sadece Türkçe)
- Mobile responsive (admin desktop-only)
- Image upload to Cloudinary (filesystem dependency)
- Real-time WebSocket testing (deterministic değil)
