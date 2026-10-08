# Pemeriksaan T10 — 2026-10-08

## Ringkasan

**Status rilis: tertahan.** Setelah laporan T10, katalog development dan galeri sudah diisi melalui admin. Pemeriksaan baca-saja dan pencocokan visual terbaru menemukan 18 produk aktif/Ready stock dan 16 foto galeri aktif. Dua deploy Netlify berstatus ready, tetapi keduanya tidak memiliki runtime functions; URL utama dan rute aplikasi menampilkan 404. Pengujian alur preview, konfirmasi sebagian informasi usaha, pemeriksaan aksesibilitas lintas perangkat, dan backup/restore masih tertunda.

Status berarti: **PASS** = bukti pemeriksaan memenuhi butir yang disebut; **FAIL** = prasyarat penerimaan diketahui belum terpenuhi; **BELUM** = pemeriksaan atau bukti belum lengkap. Kelulusan fixture tidak dianggap sebagai kelulusan data live.

## Versi dan lingkungan

- Tanggal pemeriksaan: 2026-10-08.
- Node.js `v24.19.0`; npm `11.17.0`; build memakai Next.js `16.4.0`.
- Pemeriksaan browser lokal sebelumnya dilakukan pada dev server. Pada sesi ini URL site Netlify dibuka; setelah alur perlindungan Team, browser menampilkan halaman 404 Netlify, sehingga konten aplikasi preview belum teruji.
- Source of truth aplikasi untuk persiapan rilis: checkout `C:\Daffa\Project\MamiTika\MamiTika`, branch `codex/release-preview-setup`; checkout asal di `C:\Daffa\Project\MamiTika\web` dan folder docs/reference tetap dipertahankan.
- Repo ini memiliki metadata Git dan remote `https://github.com/DaffaFirasyan/MamiTika.git`. Checkout kanonis berada pada branch `codex/release-preview-setup`; commit lokal dan remote branch sama pada `9814860bfbb141c4f42ff2ca386b319e7787516a`. Pemeriksaan remote tidak menemukan ref `main`; perubahan laporan lokal tetap belum di-commit.
- Project Netlify `mamitika-dev-preview` ditautkan ke repository `DaffaFirasyan/MamiTika` dan satu deploy awal berhasil dibuat dari branch tersebut. SSO diwajibkan untuk semua deploy. URL site: `https://mamitika-dev-preview.netlify.app`; URL utama ini mengembalikan 404 Netlify pada pemeriksaan browser.
- Pemeriksaan baca-saja pada 2026-10-08 setelah pengisian admin: 18 produk, semuanya aktif dan berstatus `ready`, masing-masing memiliki foto; 16 item galeri aktif; 1 row settings. Tidak ada mutasi database atau Storage dalam pemeriksaan ini. Angka 0 produk/galeri pada laporan T10 sebelumnya sudah kedaluwarsa.

## Pencocokan data bisnis terbaru

- Sumber pembanding: [halaman Home Mamitika](https://www.mamitika.com/home), diperiksa pada 2026-10-08.
- **Produk: cocok pada data yang dipublikasikan.** Nama, deskripsi, harga seluruh 18 produk, dan jumlah kemasan yang tercantum di sumber cocok dengan database development. Varian frozen/matang risol dan lumpia cocok pada nama, harga, deskripsi, dan foto. Tampilan foto 18 produk dibandingkan secara visual antara halaman sumber dan katalog lokal; tidak ditemukan foto yang tertukar atau hilang.
- **Isi kemasan belum dipublikasikan untuk tujuh roti satuan:** Roti Isi Coklat Lumer, Roti Smoked Beef, Roti Sosis Keju, Roti Cinnamon, Roti Pizza, Roti Keju, dan Roti Isi Daging Ayam. Nilai `package_label`/`quantity_unit` yang kosong untuk produk tersebut konsisten dengan sumber; pemilik perlu menentukan cara menampilkan satuannya sebelum publikasi.
- **Status/ketersediaan adalah keputusan operasional pemilik, bukan fakta katalog sumber.** Seluruh 18 produk kini aktif dan berstatus Ready stock di development; `preorder_lead_days` masih null. Pemilik perlu menegaskan status tersebut dan apakah pre-order berlaku per SKU sebelum konfigurasi disalin ke production.
- **Kontak dan pengaturan:** nomor WhatsApp di database cocok dengan tautan di sumber dan pemilik mengonfirmasi nomor tersebut masih benar; Instagram dan teks alamat “The Royal Stavana E9, Derwati, Bandung” juga cocok. Jam database 06.30–17.00 WIB telah dikonfirmasi ulang pemilik; halaman sumber yang diperiksa tidak mencantumkan jam atau hari layanan. Sumber memuat tautan Maps, tetapi `maps_url` database masih null. Sumber menampilkan GoFood dan ShopeeFood, sementara URL toko masing-masing belum tersimpan.
- `service_days_text`, `delivery_note`, `pickup_note`, `snack_min_boxes`, `snack_lead_days`, dan `snack_description` masih null. Pemilik mengonfirmasi pengiriman dan ambil sendiri tersedia (pengiriman lebih sering, Bandung); hari layanan dan catatan pemenuhan tetap kosong. Minimum box dan tenggat Snack Box juga belum ditetapkan. Jangan mengarang nilai.
- Galeri development kini berisi 16 item aktif. Foto galeri belum dicocokkan satu per satu terhadap sumber pada pemeriksaan ini.
- Semua query Supabase pada pembaruan ini bersifat baca-saja. Tidak ada pengubahan status, harga, foto, atau settings.

## Pemeriksaan kode dan runtime lokal

| Area | Status | Bukti |
|---|---|---|
| Metadata, canonical, bahasa | PASS | Home, menu, kontak, galeri dirender dengan `lang=id`; canonical menggunakan origin localhost pada dev. Metadata halaman dan judul diperiksa di browser/source. |
| Robots dan sitemap | PASS | `/robots.txt` mengizinkan halaman publik, mengecualikan `/admin/` dan `/api/`, serta memuat sitemap. `/sitemap.xml` memuat halaman publik dan tidak memasukkan admin/login/keranjang. Login menghasilkan `noindex, nofollow`. |
| Redirect/rute tidak tersedia | PASS (cakupan terbatas) | `/home` menuju `/`; `/gallery` menuju `/galeri`; slug produk yang tidak ada menampilkan halaman “Produk tidak ditemukan”. Admin tanpa sesi diarahkan ke login. |
| Link kontak | PASS | Nomor WhatsApp berakhiran 5812 dikonfirmasi pemilik; jam 06.30–17.00 WIB juga dikonfirmasi. Alamat database cocok dengan sumber. |
| Konfigurasi gambar | PASS | `next.config.ts` membatasi remote image ke host project Supabase yang valid dan path public bucket `catalog-images`; seluruh 18 foto produk live tampil pada katalog lokal. |
| Mobile dan keyboard | PASS parsial | Screenshot home tersedia pada 320, 390, dan 1440 px. Browser pada 320 px menunjukkan menu dapat dibuka, ditutup dengan Escape, dan fokus kembali ke tombol; lebar dokumen tetap 320 px. Halaman menu memiliki filter/urut yang terbaca. Viewport 375, 768, dan 1024 px serta alur katalog lengkap belum diperiksa. |
| Konsol/performa | BELUM | Tidak dilakukan audit performa/Core Web Vitals atau pemeriksaan lab. Screenshot berasal dari dev server dan menampilkan dev tooling. |

Screenshot lokal:

- [Home 1440 px](output/playwright/home-1440.png)
- [Home 390 px](output/playwright/home-390.png)
- [Home 320 px](output/playwright/home-320.png)

## AC-01 sampai AC-14

| AC | Status | Temuan / blocker |
|---|---|---|
| AC-01 Migrasi katalog | BELUM | 18 produk development tersedia; nama, deskripsi, harga, jumlah kemasan yang dipublikasikan, dan 18 foto cocok secara visual dengan sumber. Jumlah kemasan tujuh roti satuan tidak dicantumkan sumber. Persetujuan akhir isi/status tetap diperlukan. |
| AC-02 Belanja campuran | BELUM | Jalur live menu→detail→keranjang→pratinjau WhatsApp diuji untuk Roti Sobek Coklat Lumer, termasuk subtotal Rp38.000, metode pengiriman, catatan, dan persistensi saat navigasi. Belum menguji beberapa item, ubah/hapus sebelum pratinjau, atau perubahan katalog saat keranjang lama tersimpan. |
| AC-03 Varian | BELUM | Foto dan data varian frozen/matang dibandingkan dengan sumber; alur detail→keranjang→draft untuk pasangan varian belum dijalankan. |
| AC-04 Perubahan katalog | BELUM | Pemilik telah menggunakan admin untuk mengisi/menyunting katalog, tetapi perubahan harga/status saat pelanggan memiliki keranjang lama belum diuji. |
| AC-05 WhatsApp | PASS parsial | Pratinjau order live memuat produk, harga, jumlah, metode, catatan dan tautan `wa.me` ke nomor yang telah dikonfirmasi. Draft diperiksa tanpa mengirim pesan. Uji perangkat WhatsApp aktual belum dilakukan. |
| AC-06 Alternatif WhatsApp | BELUM | Tautan pratinjau dibuat dan keranjang tetap berisi item selama flow; fallback salin teks ketika WhatsApp tidak tersedia belum diuji pada live browser. |
| AC-07 Snack box | PASS parsial | Form Snack Box live menerima input valid dan menghasilkan pratinjau serta tautan ke nomor terkonfirmasi. Minimum dan tenggat null tetap tampil sebagai belum ditetapkan; tanggal/kuantitas invalid sudah tercakup fixture T04. Tidak ada pesan dikirim atau data disimpan. |
| AC-08 Admin | BELUM | Pemilik telah mengisi 18 produk dan 16 foto galeri melalui UI admin development. Uji non-owner, request langsung, refresh publik sesudah mutasi baru, serta integrasi Better Auth masih belum lengkap. |
| AC-09 Mobile/responsif | BELUM | Tidak ada overflow teramati pada home 320/390/1440 dan menu 320. Pemeriksaan 375/768/1024 serta setiap alur penting di semua ukuran belum dilakukan. |
| AC-10 Aksesibilitas | BELUM | Menu mobile lulus cek keyboard Escape dan fokus kembali. Pembaca layar, zoom 200%, audit kontras, fokus tertutup, error/live status, dan alur keyboard menu→detail→keranjang/snack box belum diperiksa. |
| AC-11 Visual | BELUM | Tinjauan visual lokal pada alur aktual telah dilakukan; persetujuan akhir desktop/mobile oleh pemilik belum dicatat. Galeri kini berisi 16 item aktif. |
| AC-12 Publikasi | FAIL (preview) | Deploy Netlify berhasil dibuat tetapi URL utama menampilkan 404. Redirect, canonical, bahasa, kontak, sitemap, allowlist gambar dan data produk dicocokkan secara lokal. Backup/restore, runtime preview, performa, pemeriksaan aksesibilitas menyeluruh, URL lama dan persetujuan operasional masih tertunda. |
| AC-13 Metode dan pre-order | BELUM | Validator tanggal/metode lulus fixture; flow live menguji pengiriman. Produk aktif berstatus Ready stock, `preorder_lead_days` null; aturan pre-order dan ambil sendiri belum diuji menyeluruh. |
| AC-14 Jam dan marketplace | BELUM | Jam 06.30–17.00 WIB dikonfirmasi pemilik. Sumber menampilkan GoFood/ShopeeFood, tetapi URL toko belum ada. Hari layanan tetap kosong sesuai pemilik; maps_url database belum diisi walau tautan Maps tersedia pada sumber. |

## Tes akhir

Dijalankan dari `web/` setelah perubahan terakhir:

| Perintah | Hasil |
|---|---|
| `npm test` | PASS — 36 tes; 35 lulus, 0 gagal, 1 dilewati. Yang dilewati adalah integrasi Better Auth yang memerlukan DB lokal dan kredensial owner uji. |
| `npm run lint` | PASS — exit code 0. |
| `npm run typecheck` | PASS — `tsc --noEmit`, exit code 0. |
| Deploy awal Netlify | PASS sebagai unggahan artefak — deploy `6ac74c8ff3aaf575dcc2acf3` berstatus `ready`, framework Next.js; bukan bukti runtime Next.js Netlify karena sumber deploy tercatat `api` dan tidak ada function/edge function. |
| `npm run build` lokal (pemeriksaan lanjutan) | FAIL — `BETTER_AUTH_URL` tidak tersedia pada environment shell lokal sehingga Next.js gagal mengumpulkan konfigurasi `/admin`. |

## Backup, pemulihan, dan deployment

- Instruksi dump database, salinan objek Storage, checksum, batas pemulihan, dan rollback kode tersedia di `README.md`.
- **Backup database: GAGAL / belum valid.** Folder lokal terlindungi ACL tersedia di `C:\Users\firas\AppData\Local\Mamitika-backups\development\20261008-125146`, tetapi `supabase db dump --linked` macet saat inisialisasi login role dan dibatalkan karena prompt password DB tidak terlihat. File `schema.sql` yang dihasilkan 0 byte dan bukan backup.
- **Backup Storage: PASS parsial.** CLI mencantumkan 34 objek; operasi `supabase storage cp` gagal dengan `StorageUnsupportedOperationError`. Sebagai fallback, GET objek publik berhasil mengunduh 34 objek (3.342.050 byte) ke folder backup lokal dan SHA-256 dicatat pada `storage-sha256.csv`. Ini bukti salinan byte objek, belum backup database lengkap.
- **Restore: BELUM dilakukan.** Daftar project Supabase hanya menunjukkan project development; tidak ada target kosong terisolasi. Restore tidak dicoba dan tidak ada resource baru berbayar dibuat.
- **Netlify preview: artefak awal READY, runtime FAIL.** Deploy `6ac74c8ff3aaf575dcc2acf3` berasal dari branch `codex/release-preview-setup`, commit `9814860bfbb141c4f42ff2ca386b319e7787516a`, dan berstatus `ready`; metadata Netlify mencatat `deploy_source=api`, 394 file statis diunggah, `plugin_state=none`, serta nol function dan nol edge function. URL utama: https://mamitika-dev-preview.netlify.app; permalink: https://6ac74c8ff3aaf575dcc2acf3--mamitika-dev-preview.netlify.app. Domain bawaan Netlify saja yang tercatat. Tidak ada perubahan branch `main` atau DNS.
- **Environment Netlify: PASS untuk metadata, BELUM untuk nilai/runtime.** Dashboard menunjukkan sembilan nama wajib: `ADMIN_USER_ID`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SITE_URL`, dan `SUPABASE_SECRET_KEY`. Hanya `BETTER_AUTH_SECRET`, `DATABASE_URL`, dan `SUPABASE_SECRET_KEY` ditandai secret; semuanya memakai scope Builds, Functions, Runtime dan empat konteks deploy. Variabel lain memakai All scopes dan tercatat sama pada semua konteks. Nilai environment tidak dibuka atau disalin. Target Supabase development `qvgzihrylfswbxselfyd` mengikuti konfigurasi yang dinyatakan pemilik dan belum diverifikasi melalui nilai/runtime.
- Pengaturan source yang diperiksa: `web/netlify.toml` memuat build `npm run build` dan publish `.next`; ini sesuai pola Next.js SSR/hybrid yang didokumentasikan Netlify. `web/package.json` memakai Next.js `16.4.0`; `web/next.config.ts` tidak mengaktifkan static export/standalone atau menonaktifkan adapter. [Dokumentasi Next.js Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) menyatakan OpenNext adapter diterapkan otomatis pada build Netlify untuk Next.js 13.5+, mendukung App Router/SSR/Route Handlers/Middleware, dan tidak menyarankan pin plugin legacy. Netlify CLI tidak tersedia lokal, sehingga simulasi `netlify build`/`netlify dev` tidak dilakukan.
- **SSO: PASS untuk konfigurasi, BELUM untuk login end-user.** Team protection/SSO diwajibkan untuk semua deploy dan tetap aktif. Browser tidak melewati perlindungan; URL kemudian menampilkan 404 Netlify.
- **Smoke test browser preview: FAIL/BELUM.** Home (`/`) FAIL dengan halaman 404 Netlify. Menu, detail produk, keranjang/draft WhatsApp, Snack Box, galeri, dan login/admin belum diuji karena halaman utama tidak tersaji. Tidak ada pesan WhatsApp yang dikirim dan tidak ada data bisnis yang diubah.
- **Diagnosis 404 terverifikasi dari metadata deploy:** URL yang 404 menyajikan deploy yang diunggah langsung melalui Netlify API (`deploy_source=api`), dengan file statis hasil build tetapi tanpa function/edge function (`available_functions=[]`, `required_functions=[]`, `required_edge_functions=[]`, `plugin_state=none`). Deploy itu tidak membuktikan Netlify menjalankan build Next.js dan adapter OpenNext-nya; artefaknya tidak memiliki runtime untuk melayani SSR, Route Handlers, dan rute dinamis. Ini konsisten dengan 404 homepage walau deploy berstatus `ready`. Konfigurasi repo saat ini sudah sesuai rekomendasi Netlify dan adapter otomatis; menambahkan `@netlify/plugin-nextjs` legacy tidak tepat karena dokumentasi terbaru menyarankan agar adapter tidak dipin. **Belum diperbaiki di site**: tidak ada perubahan konfigurasi kode yang dibenarkan oleh bukti, dan deploy ulang sengaja tidak dilakukan. Langkah pemulihan yang perlu diuji adalah deploy kedua sebagai Netlify Git build dari branch `codex/release-preview-setup`, agar Netlify menjalankan adapter otomatis; persetujuan pemilik diperlukan terlebih dahulu.
- **Deploy kedua atas izin pemilik — 2026-10-08.** Dari halaman Deploys Netlify yang menampilkan repository `DaffaFirasyan/MamiTika`, branch terpublikasi `codex/release-preview-setup`, dan commit `9814860bfbb141c4f42ff2ca386b319e7787516a`, opsi deploy normal `Deploy project` dijalankan sekali; opsi tanpa cache tidak dipilih. Deploy `6ac753ff992ae1218c8aebb0` selesai `ready` dalam 28 detik pada site `mamitika-dev-preview`, context Netlify `production` untuk site dev-preview, branch `codex/release-preview-setup`, commit `9814860bfbb141c4f42ff2ca386b319e7787516a`. URL: https://mamitika-dev-preview.netlify.app; permalink: https://6ac753ff992ae1218c8aebb0--mamitika-dev-preview.netlify.app. SSO tetap aktif dan domain bawaan Netlify tidak berubah. Metadata deploy tetap mencatat `deploy_source=api`, `available_functions=[]`, `required_functions=[]`, `required_edge_functions=[]`, dan `plugin_state=none`; karena itu runtime Next.js belum tersedia dan hasil ini tidak membuktikan pipeline Git build/adapter bekerja walaupun trigger berasal dari halaman site yang terhubung ke GitHub. Tidak ada deploy ketiga, perubahan environment, DNS, branch, atau data bisnis.
- Pemeriksaan konfigurasi continuous deployment secara baca-saja di Developer settings: repository `DaffaFirasyan/MamiTika` terhubung, Build status `Active`, branch production `codex/release-preview-setup`, base directory `web`, build command `npm run build`, publish directory `web/.next`, dan auto publishing aktif untuk branch tersebut. SSO masih diwajibkan site-wide. Push dokumentasi ke branch ini dipakai untuk memicu build dari Git; tidak ada perubahan pengaturan site.
- **Smoke test browser setelah deploy kedua — FAIL pada routing.** Chrome yang telah masuk ke Netlify membuka URL site tanpa melewati atau menonaktifkan SSO; halaman yang terlihat adalah 404 Netlify (`Page not found`). Hasil yang sama terlihat pada `/`, `/menu`, `/menu/roti-sobek-coklat-lumer`, `/api/catalog`, `/login`, dan `/admin`. Karena semua gagal sebelum mencapai aplikasi, login Better Auth/admin dan respons API katalog tidak dapat dinilai. Tidak ada pesan WhatsApp dikirim atau data bisnis diubah.
- Deploy memakai konteks `production` internal Netlify untuk site khusus dev-preview, bukan site/domain production MamiTika. SSO tetap aktif. Tidak ada deploy tambahan.
- Rollback kode pada Netlify dan pemulihan database/Storage merupakan prosedur terpisah; lihat `README.md`.

## Uji alur development terbaru — 2026-10-08

- Browser lokal memakai katalog development live: menu menampilkan 18 dari 18 produk aktif; tautan kartu membawa ke detail Roti Sobek Coklat Lumer dengan foto, isi 10 potong, harga Rp38.000, dan status Ready stock.
- Detail→keranjang menampilkan data katalog terbaru. Pratinjau order live memuat produk, subtotal Rp38.000, pilihan Pengiriman, dan catatan. Tautan `wa.me` mengarah ke nomor WhatsApp yang dikonfirmasi. Pesan tidak dikirim. Item uji kemudian dihapus dan keranjang kembali kosong.
- Galeri menampilkan 16 item; dialog gambar terbuka, Escape menutup, dan Enter membuka kembali dialog dari fokus yang dikembalikan ke pemicu.
- Form Snack Box live menghasilkan pratinjau/tautan untuk input uji valid. Minimum dan tenggat tidak ditampilkan sebagai angka karena tetap null. Form tidak menyimpan input dan tidak ada pesan terkirim.
- Pemeriksaan dilakukan pada layar lokal desktop dan sebelumnya 320/390 px untuk halaman-halaman storefront. Screenshot Playwright tersimpan di `.playwright-cli/` yang di-ignore; tidak menjadi artefak rilis.
- Tidak ada write ke Supabase selama pengujian browser; satu item cart lokal dibersihkan setelah flow.

## Status akses untuk menyelesaikan blocker

- Supabase CLI 2.120.0 terautentikasi dan project yang benar teridentifikasi; kedua migration lokal tercatat telah diterapkan. Dump database terhenti saat prompt password DB tidak terlihat. Storage berhasil disalin 34 objek dengan fallback HTTP dan checksum. Backup penuh serta restore terisolasi belum terbukti.
- Netlify project tetap memakai SSO. Deploy awal tersedia tetapi merupakan unggahan API tanpa runtime function; source code dan `netlify.toml` mengikuti konfigurasi Next.js auto-adapter resmi. Build lokal berhasil kompilasi lalu gagal saat koleksi data `/admin` karena `BETTER_AUTH_URL` tidak tersedia pada shell ini. Deploy Git build kedua diperlukan untuk membuktikan adapter/runtime dan menguji browser; belum dilakukan dan memerlukan persetujuan pemilik.
- Push branch `codex/release-preview-setup` sudah diverifikasi sebelumnya pada commit `9814860bfbb141c4f42ff2ca386b319e7787516a`; tidak ada ref `main` remote. Supabase tetap development; tidak ada perubahan production atau DNS.

## Blocker pemilik sebelum publikasi

1. Minta persetujuan final pemilik atas 18 produk aktif/Ready stock di development dan tentukan isi kemasan untuk tujuh roti satuan. Pre-order belum dikonfigurasi per SKU.
2. Konfirmasi/isi tautan Maps dan URL toko GoFood/ShopeeFood jika ingin ditampilkan. WhatsApp, alamat, dan jam telah dikonfirmasi; hari layanan, catatan fulfillment, minimum/tenggat Snack Box sengaja tetap kosong.
3. Lanjutkan uji live untuk keranjang multi-item, perubahan katalog ketika cart lama tersimpan, hapus/salin fallback WhatsApp, varian frozen/matang, dan fulfillment ambil sendiri.
4. Dua deploy dev-preview telah dicoba; deploy kedua memakai opsi normal dari halaman Netlify yang terhubung ke GitHub, tetapi metadata masih menyebut `deploy_source=api` dan tidak ada functions. Periksa konfigurasi build/pipeline Git Netlify atau minta Netlify membangun repo melalui integrasi Git yang sesungguhnya sebelum deploy berikutnya; jangan ulangi deploy tanpa izin baru dan jangan ubah konfigurasi SSO.
5. Buat backup database **dan** Storage, lalu buktikan restore di project kosong terisolasi.
6. Lengkapi pemeriksaan 375/768/1024 px, Chrome/Android dan Safari/iPhone yang tersedia, screen reader, kontras, zoom 200%, performa, dan persetujuan visual pemilik.
7. Ulangi smoke test preview. Publikasi, production credentials, domain/DNS, dan seed production memerlukan keputusan/otorisasi terpisah.

Website belum siap dipublikasikan.
