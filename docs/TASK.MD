# Mamitika Implementation Plan — TASK

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Website bakery responsif dengan katalog Mamitika, keranjang ke WhatsApp, konsultasi snack box, dan admin khusus pemilik melalui akun lokal email/password.

**Architecture:** Satu aplikasi Next.js dengan halaman publik server-rendered dan komponen klien seperlunya. Better Auth mengelola satu akun lokal dan sesi database; Supabase menyediakan database katalog dan foto. Netlify menjadi hosting awal, sedangkan pesanan dilanjutkan melalui WhatsApp.

**Tech Stack:** Node.js 24 LTS, Next.js 16 App Router, React 19, TypeScript strict, CSS/CSS Modules, Supabase JS + SSR, sharp, Node test runner, Netlify.

**Spec:** [PRD.md](PRD.md), [TRD.md](TRD.md), [DESIGN.md](DESIGN.md).

Baris skill di atas berlaku bagi agen yang menyediakan Superpowers. Jika tool vibecoding Anda tidak menyediakan skill tersebut, ikuti checklist, kontrak, dan pemeriksaan pada dokumen ini secara berurutan; tidak perlu memasang plugin hanya untuk membaca rencana. Pengguna akan menjalankan implementasi melalui tool pilihannya. Penyusunan TASK ini tidak memulai implementasi.

## Global Constraints

- Bahasa Indonesia; timezone **Asia/Jakarta**; jam **06.30–17.00 WIB**, tanpa hari layanan hasil tebakan.
- Sumber 18 SKU: `mamitika-redesign-reference/catalog.csv`; 38 gambar/36 isi unik, dengan mapping yang perlu ditinjau.
- Ready stock, pre-order, pickup, dan delivery; ongkir/jadwal/total akhir dikonfirmasi di WhatsApp.
- Keranjang menyimpan ID dan quantity, bukan harga/nama/data pribadi; subtotal contoh **Rp102.000**.
- SKU frozen/matang terpisah; galeri bukan sumber otomatis produk baru.
- Null pada minimum/tenggat/marketplace berarti belum diketahui; tidak mengarang nilai bisnis atau tautan.
- Tidak ada Google/OAuth/identity provider. Better Auth memakai password hash, sesi database, rate limiting persisten, dan public sign-up disabled. `ADMIN_USER_ID` membatasi satu owner. Aksi admin wajib `requireAdmin()`; Supabase secret key hanya server-side untuk mutasi admin dan importer, sadar bahwa secret key bypasses RLS.
- Aplikasi berada di `web/`; materi sumber tidak ditimpa atau dihapus.
- Tidak menambah payment, order database, akun pelanggan, stok otomatis, chatbot, atau statistik/testimoni palsu.
- Setiap checkpoint memakai hasil pemeriksaan nyata. Jangan menandai PASS untuk browser/perangkat yang belum diperiksa.

## Review Focus

1. localStorage rusak, hidrasi awal, atau akses storage ditolak browser → pilihan baru tetap bekerja; data tidak ditimpa sebelum dibaca. Ditangani T04/T06.
2. Harga/status berubah ketika pelanggan sedang berbelanja → snapshot segar, peringatan, dan item bermasalah tidak ikut pesan. Ditangani T04/T06.
3. Pergantian hari Jakarta dan tanggal yang tidak ada → kalender benar, bukan tanggal UTC yang berbeda. Ditangani T04/T07.
4. Pengunjung tanpa sesi atau permintaan langsung ke server action/API → tidak mendapat akses write walaupun UI/proxy dilewati. Ditangani T03/T08.
5. Upload berhasil tetapi save gagal, atau backup tanpa file foto → foto lama tetap dipakai dan recovery lengkap. Ditangani T08/T10.

## Cara menjalankan vibecoding

Mulai satu task, periksa hasilnya, baru lanjut task berikutnya. Prompt awal:

```text
Baca PRD.md, TRD.md, DESIGN.md, TASK.md, dan AGENTS.md jika tersedia.
Kerjakan hanya T01 dalam TASK.md. Ikuti data sumber dan keputusan yang sudah
ditetapkan. Jangan menebak foto produk, aturan bisnis, kredensial, atau hasil tes.
Selesaikan checklist task ini, periksa hasilnya, lalu laporkan berkas yang berubah,
pemeriksaan yang dijalankan, dan hambatan konkret. Perbarui checkbox yang benar-benar
selesai. Jangan lanjut task lain atau mempublikasikan website pada task ini.
```

Untuk langkah berikutnya ganti `T01` dengan ID task berikutnya. Setelah app tersedia, gunakan prompt berikut saat hasil mulai tampak generik:

```text
Periksa tampilan yang sudah ada terhadap DESIGN.md menggunakan screenshot desktop
dan mobile. Perbaiki komposisi, foto asli, hierarchy teks, keterbacaan harga/isi,
serta alur Menu dan Snack Box. Hilangkan elemen yang gagal kriteria desain bagian 9.
Pertahankan kontrak fitur yang sudah benar. Laporkan hasil yang benar-benar dilihat.
```

Semua command di bawah dijalankan pada **PowerShell lokal**, dari root workspace, kecuali disebutkan lain:

```powershell
Set-Location 'C:\Users\firas\OneDrive\Dokumen\ChatGPT\Mami Tika'
```

Jangan menjalankan perintah lokal tersebut pada Web SSH. Pada checkout lain, gunakan path root checkout yang sebenarnya.

## File structure dan checkpoint

Struktur file lengkap dan tanggung jawab ada di TRD §3. T01 menaruh data turunan di folder referensi; T02 baru membuat `web/` dan menyalinnya ke `web/data/`. Jangan membuat `web/` berisi file sebelum scaffold, supaya generator tidak menolak direktori nonkosong.

| ID | Deliverable | Bergantung pada | PRD acceptance |
| --- | --- | --- | --- |
| T01 | Mapping dan data migrasi | Data sumber | AC-01, AC-03 |
| T02 | Pratinjau visual dan fondasi app | T01 | AC-09, AC-11 |
| T03 | Schema auth lokal, sesi Better Auth, kontrol server admin | T02, konfigurasi operator | AC-08 |
| T04 | Aturan keranjang, tanggal, pesan | T03 types | AC-02–07, AC-13 |
| T05 | Katalog dan konten publik live | T03, T01 | AC-01, AC-03, AC-14 |
| T06 | Keranjang interaktif dan WhatsApp | T04, T05 | AC-02, AC-04–06, AC-13 |
| T07 | Form snack box dan galeri | T04, T05 | AC-07, AC-10 |
| T08 | Admin produk dan upload aman | T03, T05 | AC-08, AC-04 |
| T09 | Admin galeri/settings | T08 | AC-08, AC-14 |
| T10 | Pemeriksaan, backup, deploy | T01–09 | AC-01–14 |

### T01 — Siapkan katalog dan pemetaan foto

**Files:** read `mamitika-redesign-reference/catalog.csv`, `asset-manifest.csv`, `images/`; create `mamitika-redesign-reference/catalog.seed.json`, `product-asset-map.json`.

**Interfaces:** menghasilkan 18 objek seed dengan field database TRD §4.1; map `{productSlug,sourceFile,alt,verified,notes}`. Belum membuat project aplikasi.

- [x] Baca CSV dengan parser yang benar, bukan split koma. Di PowerShell, `Import-Csv` sudah cukup. Pastikan total 18 produk.
- [x] Cocokkan konteks halaman Home pada manifest dan pengamatan visual; kandidat yang belum pasti tetap ditandai belum terverifikasi.
- [x] Tandai mapping belum pasti sebagai `verified=false` dengan alasan; hanya mapping terverifikasi boleh menjadi foto SKU live. Tunjukkan pilihan yang ragu kepada pemilik ketika diperlukan.
- [x] Buat seed dengan slug tetap, kategori teknis, harga integer, package label, availability `unconfirmed`, dan ID UUID stabil. Semua seed tetap nonaktif sampai pemilik meninjau; foto yang belum pasti tidak diaktifkan di produksi.
- [x] Kurasi aset hero/snack box/logo sesuai DESIGN dan foto galeri tanpa duplikat. Produk tanpa harga di galeri tidak ditambahkan sebagai SKU.
- [x] Periksa nama, harga, deskripsi, dan 18 entri dibanding CSV; catat harga masih perlu review pemilik sebelum rilis.
- [ ] Jika repository tersedia, commit hanya file task ini. Checkout ini tidak memiliki Git metadata.

**Check:** dibaca ulang kedua JSON; 18 seed/mapping, slug dan ID unik, harga positif, seluruh referensi file yang diisi ada. Mapping `verified=false` dilaporkan belum selesai untuk rilis dan tidak difabrikasi.

### T02 — Fondasi aplikasi dan pratinjau desain

**Files:** create `web/` melalui scaffold; `web/src/app/layout.tsx`, `web/src/app/globals.css`, `web/src/app/(store)/layout.tsx`, `web/src/app/(store)/page.tsx`, `web/src/app/(store)/menu/page.tsx`, `web/src/components/site-header.tsx`, `web/src/components/site-footer.tsx`, `web/src/components/product-card.tsx`, `web/src/lib/types.ts`, `web/public/brand/logo.png`, `web/public/images/`, `web/data/catalog.seed.json`, `web/data/asset-map.json`; root `.gitignore` bila belum ada.

**Interfaces:** shell storefront dan `ProductCard({product:PublicProduct})`; definisikan PublicProduct/Category/Availability di `types.ts` sesuai TRD, kemudian diperluas di T03 tanpa membuat tipe duplikat. Preview menggunakan seed, bukan klaim database sudah terhubung.

- [ ] Periksa apakah kode/framework sudah ada sebelum scaffold. Jika belum, gunakan generator Next.js dengan pilihan TypeScript, ESLint, App Router, src directory, alias `@/*`; Tailwind/React Compiler/Cache Components nonaktif sesuai TRD.
- [ ] Pin paket yang terpasang dan commit lockfile; jangan memilih canary. Setup Node 24 LTS dan scripts `dev`, `build`, `lint`, `typecheck`; lint menggunakan ESLint CLI, bukan `next lint`.
- [ ] Setelah scaffold selesai, salin data turunan T01 ke `web/data/`, serta logo/foto preview tanpa memindahkan sumber asli.
- [ ] Tulis token dan typography DESIGN. Implementasikan hero, pintasan kategori, pilihan menu, snack box, kontak/footer, dan kartu katalog dengan data nyata yang sudah terpetakan.
- [ ] Buat menu mobile dengan label, expanded state, Escape, dan fokus; implementasikan header responsive tanpa floating widget tambahan.
- [ ] Jalankan app dan ambil screenshot desktop 1.440 px serta mobile 390 dan 320 px. Cocokkan dengan DESIGN §9 dan perbaiki sebelum integrasi berikutnya.
- [ ] Jalankan lint, typecheck, build; simpan hasil pemeriksaan dan commit file task bila Git tersedia.

Command scaffold dilakukan dari root:

```powershell
npx create-next-app@16.4.0 web
```

Versi adalah baseline terverifikasi; cek patch keamanan/CLI saat task dijalankan. Setelah memilih opsi generator secara eksplisit:

```powershell
npm --prefix web run dev
```

Di terminal lokal lain:

```powershell
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run build
```

**Check:** halaman preview dapat dilihat, logo/foto asli termuat, filter/header dapat dipakai, tidak ada overflow 320 px; build/lint/typecheck berakhir sukses. Tidak membuat tes yang hanya memeriksa string CSS.

### T03 — Autentikasi lokal email/password dan kontrol akses admin

**Files:** refactor hasil T03 lokal dari Supabase Auth ke Better Auth; buat `web/src/lib/auth.ts`, `web/src/lib/auth-client.ts`, `web/src/lib/supabase/public.ts`, `web/src/lib/supabase/admin.ts`, `web/src/proxy.ts`, `web/src/app/api/auth/[...all]/route.ts`, `web/src/app/login/page.tsx`, `web/src/app/admin/layout.tsx`, `web/src/app/admin/page.tsx`, `web/.env.example`, schema/migration private auth `app_auth`, `web/scripts/create-owner.mjs`, `web/scripts/reset-owner-password.mjs`, `web/tests/auth.test.ts`, dan `web/tests/authz.sql`. Hapus Supabase Auth callback/session clients dan `admin_users` berbasis `auth.users`; Supabase JS tetap dipakai untuk data publik/admin.

**Interfaces:** `requireAdmin(): Promise<{userId:string}>` memverifikasi sesi Better Auth dan cocokkan ID dengan `ADMIN_USER_ID`. Better Auth memakai PostgreSQL role terbatas pada schema `app_auth`; public Supabase client memakai publishable key/RLS; admin Supabase client memakai secret key hanya pada server sesudah guard.

- [ ] Periksa status migrasi database sebelum mengubahnya. Laporan T03 sebelumnya menyebut migrasi belum diterapkan; verifikasi ulang. Jika belum pernah diterapkan, sesuaikan migration lokal yang mengasumsikan Supabase Auth. Jika sudah diterapkan, buat migration maju yang kompatibel.
- [ ] Baca dokumentasi resmi Better Auth dan Supabase terbaru. Pin Better Auth, PostgreSQL adapter, dan `pg`; gunakan hashing default scrypt, sesi persistent, trusted origins/CSRF aktif, cookie aman, serta rate limit login dengan storage database.
- [ ] Buat schema auth Better Auth di schema privat `app_auth` yang tidak diekspos Data API. Generate schema menggunakan Better Auth CLI, masukkan SQL yang sudah ditinjau ke migration Supabase CLI. Runtime tidak boleh membuat schema/tabel.
- [ ] Buat owner lewat script CLI lokal saja; jangan sediakan route signup, jangan masukkan password sebagai argumen shell/log/chat. Aplikasi mengunci sign-up dan `requireAdmin()` membandingkan session user ID dengan `ADMIN_USER_ID`. Script recovery password juga lokal-only. Form hanya menyediakan login dan ganti password setelah autentikasi; tidak ada reset email.
- [ ] Pertahankan RLS dan GRANT minimum: public/anon hanya membaca baris publik dan tidak bisa menulis. Better Auth session bukan identitas Supabase RLS. Mutasi admin menggunakan server-only secret key yang bypasses RLS hanya setelah `requireAdmin()`; dokumentasikan batas ini dan jangan bocorkan key ke browser.
- [ ] Refactor Proxy, halaman login, logout, expiry/error state, auth endpoint, dan semua data access. Hapus alur Supabase Google OAuth, auth callback, UUID `auth.users`, `admin_users`, serta helper sesi Supabase Auth. Setiap Server Action/Route Handler harus memanggil `requireAdmin()`.
- [ ] Jalankan `tests/authz.sql` untuk membuktikan public/anon tidak dapat menulis via Supabase API; jalankan `tests/auth.test.ts` untuk login benar/salah, signup ditolak, session valid/expired, akses server tanpa sesi ditolak, dan owner ID diterima.
- [ ] Periksa browser: owner login/logout, password ganti, halaman admin terlindungi, request langsung tanpa sesi ditolak, dan session expiry kembali ke login. Jangan pakai mock untuk menyebut integrasi lulus.
- [ ] Jalankan lint/typecheck/build, simpan bukti pemeriksaan, dan commit task bila Git tersedia.

**Check:** akun lokal owner dapat login; signup publik dan request admin tanpa sesi ditolak. Public write tetap ditolak RLS. Admin mutation hanya berhasil lewat server setelah guard. Jangan mengklaim RLS menjadi lapisan kedua untuk admin mutation yang memakai secret key. T05 dan task admin berikutnya memakai kontrak ini.

### T04 — Aturan keranjang, tanggal WIB, dan pesan

**Files:** create `web/src/lib/cart.ts`, `web/src/lib/whatsapp.ts`, `web/src/lib/dates.ts`, `web/src/lib/validation.ts`, `web/tests/business.test.ts`, `web/tests/validation.test.ts`; modify scripts `web/package.json`.

**Interfaces:** seluruh fungsi TRD §§6.3–6.4, `CartReview`, `StoredCart`, `OrderPreferences`, `SnackInquiry`, dan `ActionResult` dari types bersama. Tidak membaca DOM/storage langsung di fungsi aturan bisnis; IO ada pada komponen task berikutnya.

- [ ] Tulis tes gagal untuk subtotal, reconciliation, parser storage, encoding, WIB, serta formulir. Gunakan fixture kecil berdasarkan harga sumber, bukan framework/fixtures besar.
- [ ] Jalankan tes dan pastikan gagal karena fungsi yang belum tersedia/perilaku salah, bukan kesalahan setup yang tidak terkait.
- [ ] Implementasikan fungsi murni dan validasi sesuai kontrak TRD. Format rupiah memakai Intl, tanggal memakai Intl dengan Asia/Jakarta, pesan memakai URLSearchParams.
- [ ] Tambahkan checks untuk quantity negatif/desimal/overflow, versi storage tak dikenal, item duplikat, missing/unavailable, minimum/tenggat null dan terisi, serta tanggal mustahil.
- [ ] Jalankan kedua file tes, typecheck, dan build; commit perubahan yang relevan.

Minimum assertions yang harus tersedia dengan fixture `sobek`, `soes`, dan `settings` yang dibuat dalam tes:

```ts
assert.equal(reconcileCart([
  { productId: sobek.id, quantity: 1 },
  { productId: soes.id, quantity: 2 }
], [sobek, soes]).subtotalRupiah, 102000);

assert.equal(todayInJakarta(new Date('2026-10-07T17:30:00Z')), '2026-10-08');
assert.equal(isValidCalendarDate('2026-02-30'), false);

const message = 'Catatan: coklat & keju\nTerima kasih 😊';
const url = buildWhatsAppUrl('6283197665812', message);
assert.ok(url);
assert.equal(new URL(url).searchParams.get('text'), message);
assert.equal(buildWhatsAppUrl('6283197665812', 'x'.repeat(9000)), null);
```

Script package `test`: `node --test tests/business.test.ts tests/validation.test.ts`. Gunakan `import type`, import relatif dengan `.ts`, dan syntax TypeScript yang dapat dihapus tanpa transform tambahan. `tsconfig` mengizinkan import TS extensions dengan noEmit; tests tidak memakai alias `@/*` atau mengimport TSX. Tetapkan `type: module` pada package bila diperlukan untuk import ESM. Type stripping native tidak menggantikan typecheck. [Panduan TypeScript Node 24](https://nodejs.org/docs/latest-v24.x/api/typescript.html).

```powershell
npm --prefix web test
npm --prefix web run typecheck
npm --prefix web run build
```

**Check:** dua file tes lulus termasuk input buruk; nilai Rp102.000 dan tanggal WIB berasal dari assertion, bukan pembulatan/klaim manual.

### T05 — Katalog dan halaman publik menggunakan data live

**Files:** create `web/src/lib/catalog.ts`, `web/src/lib/images.ts`, `web/src/app/api/catalog/route.ts`, `web/src/app/(store)/menu/[slug]/page.tsx`, `web/src/app/(store)/kontak/page.tsx`, `web/src/app/(store)/error.tsx`, `web/src/app/(store)/loading.tsx`, `web/src/app/not-found.tsx`, `web/scripts/import-catalog.mjs`; modify homepage/menu/ProductCard dan `web/next.config.ts`.

**Interfaces:** `getPublicCatalog`, `getPublicProduct`, `getPublicGallery` dan `/api/catalog` mengikuti TRD §6.2; semua UI membaca `PublicProduct`, bukan row database mentah.

- [ ] Implementasikan public reader tanpa sesi pemilik dan cache harga tambahan. Error database tetap error, bukan daftar kosong. Endpoint mengembalikan hanya produk aktif dan settings publik.
- [ ] Buat importer dry-run yang menunjukkan 18 SKU dan file yang akan digunakan tanpa menampilkan key. Impor memakai SDK yang sudah ada; hasil berupa insert/skip/error, dengan skip slug existing agar tidak menimpa edit pemilik.
- [ ] Implementasikan `normalizeImage` di images.ts dan deklarasikan sharp, lalu gunakan pada importer; path output UUID WebP dan metadata sesuai TRD. Fungsi yang sama dipakai upload T08.
- [ ] Operator menjalankan impor ke development memakai secret lokal khusus proses; upload mapping verified ke Storage. Produk tanpa mapping verified tetap nonaktif pada live dataset.
- [ ] Sambungkan beranda/katalog ke database; filter query category, sorting, status, dan pilihan beranda sesuai DESIGN. Buat detail yang dapat dibagikan dengan slug tetap.
- [ ] Buat halaman kontak dengan jam layanan, kedua metode, tautan peta/Instagram/WhatsApp; marketplace kosong tidak muncul. Tidak menambah hari buka.
- [ ] Tambahkan image remotePatterns yang sempit, dimensi/sizes yang benar, loading/error/empty state, dan redirect `/home` serta `/gallery`.
- [ ] Periksa 18 harga/varian dalam development, detail URL, filter/back, inactive/unavailable, serta API yang tidak membocorkan row privat. Database gagal menampilkan Coba lagi, bukan “produk habis”.
- [ ] Jalankan lint/typecheck/build dan commit task.

**Check:** HTML awal memuat nama/harga dari database; endpoint segar; URL foto produksi bukan URL Google hasil scraping. Jumlah produk aktif boleh <18 bila mapping belum terverifikasi, dan itu dilaporkan untuk rilis.

Package scripts import: `seed:dry` → `node --env-file=.env.local scripts/import-catalog.mjs --dry-run`; `seed` → command yang sama tanpa `--dry-run`. Operator menjalankan dry-run dahulu dengan environment development. Jangan menjalankan seed terhadap produksi sebelum checkpoint rilis.

### T06 — Keranjang, persist, dan WhatsApp

**Files:** create `web/src/components/cart-provider.tsx`, `web/src/components/quantity-input.tsx`, `web/src/app/(store)/keranjang/page.tsx`; modify storefront layout, header, ProductCard dan detail.

**Interfaces:** provider menyediakan `items`, `add(productId, quantity)`, `setQuantity(productId, quantity)`, `remove(productId)`; membaca fungsi T04. Badge menghitung total quantity unit jual. `ProductCard` memakai callback dari provider, bukan menyimpan harga ke storage.

- [x] Periksa baseline: tombol belum menyimpan keranjang dan refresh belum mempertahankan pilihan. Tentukan alur browser sebagai pemeriksaan perubahan ini.
- [x] Implementasikan hydration/storage key dan reducer sederhana. Jangan menulis keranjang kosong sebelum storage dibaca; ketika storage ditolak, gunakan memori dan beri pemberitahuan tanpa membuat app crash.
- [x] Sambungkan Tambah, jumlah minimum 1, Hapus, badge, dan konfirmasi aria-live. Produk unavailable tidak dapat ditambahkan.
- [x] Buat keranjang sesuai DESIGN, fulfillment radio default undecided, lokasi ringkas, tanggal wajib untuk preorder, dan catatan. Batas input mengikuti validator.
- [x] Fetch katalog segar sebelum pratinjau final, reconcile, tampilkan perubahan harga/blocked items. Pengguna meninjau sebelum WhatsApp dibuka. Error tidak menghapus pilihan atau mengirim subtotal lama.
- [x] Implementasikan pesan/fallback Clipboard/URL panjang. Gunakan tautan yang dibuka setelah pratinjau siap agar async fetch tidak memicu popup yang diblokir. Tetap ada copy manual.
- [ ] Uji browser: sobek 1 + Soes 2 = Rp102.000, refresh, ubah/hapus, catatan `&`/emoji, unavailable, dan storage ditolak. Lakukan perubahan harga melalui operator SQL development sampai admin T08 tersedia, lalu periksa pembaruan pada sesi pelanggan.
- [x] Buka pratinjau WhatsApp dan periksa isi/nomor; tidak perlu mengirim pesan. Keranjang tidak terhapus dan tidak ada layar sukses order.
- [ ] Jalankan test/lint/typecheck/build, simpan bukti, commit task.

**Check:** AC-02,04,05,06,13 terpenuhi dengan data live dan refresh, bukan hanya reducer unit check.

### T07 — Snack box dan galeri pelanggan

**Files:** create `web/src/app/(store)/snack-box/page.tsx`, `web/src/app/(store)/galeri/page.tsx`, `web/src/components/gallery-lightbox.tsx`; form snack box dapat ditempatkan dalam komponen dekat halaman bila menjadi client island.

**Interfaces:** form memakai `validateSnackInquiry`, `buildSnackMessage`, dan settings T05; galeri memakai `getPublicGallery`. Form tidak menulis database order.

- [x] Buat editorial snack box dengan foto nyata dan form DESIGN. Tidak menampilkan paket/harga yang belum ada.
- [x] Sambungkan input tanggal/box/budget/preferensi/catatan ke validator; settings minimum/tenggat null tidak menjadi angka karangan.
- [x] Buat pratinjau permintaan dan tombol WhatsApp/copy. Data inquiry tidak disimpan ke localStorage atau analytics.
- [x] Buat grid galeri, caption, dialog foto, Escape dan focus return tanpa library carousel/masonry.
- [x] Uji kebutuhan acara valid, tanggal kemarin/mustahil, jumlah nol/desimal, minimum null versus terisi. Pergantian hari WIB sudah dipin pada unit test T04.
- [ ] Periksa keyboard, error focus, label input, dan lightbox di desktop/mobile. Data gagal dimuat mendapat pesan dan retry.
- [ ] Jalankan test/lint/typecheck/build, simpan bukti, commit task.

**Check:** pelanggan mendapat pesan inquiry terpisah dari keranjang; tidak ada jadwal/paket palsu atau klaim pesan sudah terkirim.

### T08 — Admin produk dan upload

**Files:** create `web/src/app/admin/produk/page.tsx`, `web/src/app/admin/produk/baru/page.tsx`, `web/src/app/admin/produk/[id]/page.tsx`, `web/src/app/admin/actions.ts`, `web/src/app/api/admin/images/route.ts`, `web/src/components/admin/product-form.tsx`; extend `web/src/lib/images.ts`, validation/types/validation.test.ts dan authz.sql.

**Interfaces:** `ProductInput` field camelCase yang boleh diedit dalam TRD; `saveProduct(id,input)` memakai `ActionResult`; `upload` response `{path,width,height}`. Dimensi tersimpan ditentukan server, bukan dipercayai dari input form.

- [x] Tambahkan tes gagal validator nama/kategori/harga negatif, path gambar tidak sah, status/tenggat, serta upaya mengubah slug existing. Jalankan untuk memastikan kegagalan yang relevan.
- [x] Buat daftar/editor responsive tanpa statistik dummy. Produk baru default inactive; slug lama readonly; status dan isi kemasan jelas.
- [x] Implementasikan Server Action owner-scoped: `requireAdmin()` memverifikasi Better Auth session dan `ADMIN_USER_ID` sebelum memakai server-only Supabase secret client. Gunakan field allowlist dan validasi. Ingat secret client melewati RLS; tidak boleh diekspor ke browser. Save gagal mempertahankan state editor; sukses memperbarui tampilan setelah database mengonfirmasi.
- [x] Implementasikan upload dengan Origin check, owner check, decode nyata, maksimum 3 MiB/20 MP, output WebP maksimum sisi 1.600 tanpa upscale, path UUID baru. Validasi referensi/dimensi gambar di server ketika menyimpan produk.
- [x] Gunakan gambar lama sampai save baru berhasil. Kandidat upload yang berhasil dapat di-retry; tidak menghapus foto lama secara otomatis.
- [ ] Uji request upload/mutation tanpa sesi dan dengan user ID yang bukan `ADMIN_USER_ID`; handler menolak sebelum memanggil secret client. Uji berkas palsu/non-image, oversize, upload layanan gagal, serta upload sukses + save database gagal.
- [ ] Uji real UI: pemilik ubah harga/foto/status, pelanggan refresh dan melihat hasil. Keranjang sesi lama menangani perubahan harga/status. Nama diubah tanpa perubahan slug.
- [ ] Jalankan tests/authz/test/lint/typecheck/build, simpan bukti, commit task.

**Check:** AC-08 mencakup write/persist/refresh dan failure recovery; endpoint langsung tetap menolak non-owner. Jangan menyelesaikan task dengan form dummy yang hanya memberi toast sukses.

### T09 — Admin galeri dan pengaturan usaha

**Files:** create `web/src/app/admin/galeri/page.tsx`, `web/src/app/admin/pengaturan/page.tsx`, `web/src/components/admin/gallery-form.tsx`, `web/src/components/admin/settings-form.tsx`; extend `web/src/app/admin/actions.ts`, types, validation, validation.test.ts.

**Interfaces:** `GalleryInput`, `SettingsInput`, `saveGalleryItem`, `saveSettings`, sesuai TRD §§4/6.5; gunakan upload T08 tanpa uploader kedua.

- [x] Tambahkan checks gagal untuk nomor WhatsApp, URL non-HTTPS, integer minimum/tenggat, jam terbalik, dan teks melebihi batas. Null/field optional yang valid tetap diterima.
- [x] Implementasikan galeri create/edit/urutan/caption/aktif dan pratinjau; deactivation mempertahankan data lama bagi owner.
- [x] Implementasikan singleton settings yang berisi jam awal, kontak, metode, marketplace, dan aturan snack box. Hari belum diketahui tetap kosong; null tidak dipaksa menjadi 0.
- [x] Gunakan requireAdmin dan validasi server yang sama; hanya simpan field yang diizinkan, tanpa menambah baris settings.
- [ ] Uji owner memperbarui jam/tautan/aturan kemudian refresh publik; marketplace kosong tidak menghasilkan tombol rusak. Perubahan minimum/tenggat mempengaruhi form snack box.
- [ ] Periksa galeri inactive tidak terlihat publik, dan request tanpa sesi atau non-owner tidak dapat memutasi settings melalui request langsung.
- [ ] Jalankan test/lint/typecheck/build dan authz checks bila policy berubah; simpan bukti, commit task.

**Check:** pengelolaan seluruh konten PRD tersedia dan persist; tidak ada input yang pura-pura tersimpan hanya dalam state browser.

### T10 — Pemeriksaan rilis, backup, dan deployment

**Files:** create/finish `web/src/app/robots.ts`, `sitemap.ts`, metadata tiap halaman, `web/netlify.toml`; document results in `web/RELEASE_CHECKS.md` dan backup instructions di `web/README.md`. Backup berisi data/secret tidak masuk repository.

**Interfaces:** build Netlify dari base directory `web`, command `npm run build`, publish `.next`; runtime memerlukan Better Auth secret, `DATABASE_URL` terbatas, `ADMIN_USER_ID`, Supabase URL/publishable key dan server-only secret untuk admin mutation. Dataset production terpisah dari development.

  - [x] Implementasikan metadata/sitemap/canonical/lang serta admin noindex. Periksa redirect lama, inactive route, image config, dan link kontak.
  - [x] Jalankan tests, lint, typecheck, build sekali setelah perubahan terakhir; jangan menyamakan build dengan lulus lint.
  - [x] Periksa AC-01 sampai AC-14, desktop/mobile/keyboard dan browser yang tersedia. Simpan screenshot viewport dan temuan/perbaikan di RELEASE_CHECKS. Tulis belum dilakukan untuk perangkat yang tidak tersedia.
- [ ] Periksa kontras aktual, zoom 200%, fokus tak tertutup, label/error/live status, dan alur dialog. Periksa performa mobile; hasil lab tidak diklaim sebagai field Core Web Vitals.
- [ ] Operator meninjau harga, mapping foto, status SKU, informasi usaha dan aturan yang tampil. Semua 18 SKU yang akan aktif memiliki foto yang benar; unknown bisnis tetap disajikan sebagai konsultasi.
- [ ] Buat backup database + file Storage dan uji restore pada development. Setelah restore, 18 SKU sumber, settings, dan referensi gambar cocok. Dump tanpa file bukan backup foto.
- [ ] Deploy preview dengan database development dan env Better Auth/Supabase. Uji SSR, login lokal, secure session cookie, signup nonaktif, Server Action, upload 3 MiB, foto, dan pratinjau WhatsApp di runtime Netlify.
- [ ] Operator mengonfirmasi akun production, environment auth/database/server secret, kuota Free dan keamanan password owner; importer dry-run lalu seed production yang disetujui. Jangan overwrite dataset owner yang sudah ada.
- [ ] Sajikan hasil konkret yang siap publikasi kepada pemilik. Setelah publikasi/perubahan DNS diotorisasi, pindahkan domain dengan menjaga record lain, lalu periksa HTTPS, metadata, redirect, login lokal/logout, katalog, admin save dan WhatsApp pada domain final.
- [ ] Catat versi, tanggal deployment, hasil smoke check, cara rollback kode, dan pemulihan data terpisah. Commit laporan yang aman; jangan commit backup/key.

Command lokal checkpoint akhir:

```powershell
npm --prefix web test
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run build
```

**Check:** seluruh AC diberi PASS/FAIL/belum dilakukan beserta bukti; aplikasi boleh dinyatakan siap rilis hanya setelah pemeriksaan wajib dan review konten lulus. Layanan/akun/DNS yang belum tersedia tetap tercatat sebagai pekerjaan tertunda, bukan diatasi dengan data palsu.

## Selesai dan pemeliharaan

- [ ] Seluruh P0 dan 14 kriteria PRD terpenuhi; tidak ada kendala yang menghalangi pelanggan atau pemilik.
- [ ] Pemilik dapat login lokal dengan email/password, mengubah produk/foto/settings, serta memeriksa hasilnya di publik; endpoint admin menolak request tanpa sesi.
- [ ] Pengguna dapat berbelanja atau meminta snack box melalui WhatsApp tanpa kebingungan tentang status konfirmasi.
- [ ] Operator mempunyai instruksi backup/restore, akses dashboard kuota, serta kontak akun domain.

Tugas opsional seperti analytics, pencarian, atau cache tambahan dibuat sesudah kebutuhan terlihat. Jangan menambahkan implementasi di luar task hanya karena tool dapat membuatnya.
