# Pemeriksaan T10 — 2026-10-08

## Ringkasan

**Status rilis: tertahan.** Setelah laporan T10, katalog development dan galeri sudah diisi melalui admin. Pemeriksaan baca-saja dan pencocokan visual terbaru menemukan 18 produk aktif/Ready stock dan 16 foto galeri aktif. Data produk yang dipublikasikan di halaman sumber cocok; jumlah kemasan untuk beberapa roti satuan memang tidak dicantumkan. Pengujian alur pelanggan live, konfirmasi sebagian informasi usaha, pemeriksaan aksesibilitas lintas perangkat, backup/restore, dan Netlify preview masih tertunda.

Status berarti: **PASS** = bukti pemeriksaan memenuhi butir yang disebut; **FAIL** = prasyarat penerimaan diketahui belum terpenuhi; **BELUM** = pemeriksaan atau bukti belum lengkap. Kelulusan fixture tidak dianggap sebagai kelulusan data live.

## Versi dan lingkungan

- Tanggal pemeriksaan: 2026-10-08.
- Node.js `v24.19.0`; npm `11.17.0`; build memakai Next.js `16.4.0`.
- Pemeriksaan browser sebelumnya dilakukan pada dev lokal, bukan deploy preview atau domain publik. Pada sesi 2026-10-08, home juga diperiksa lagi di `http://127.0.0.1:3001` setelah perbaikan teks fallback.
- Source of truth aplikasi untuk persiapan rilis: checkout `C:\Daffa\Project\MamiTika\MamiTika`, branch `codex/release-preview-setup`; checkout asal di `C:\Daffa\Project\MamiTika\web` dan folder docs/reference tetap dipertahankan.
- Repo ini memiliki metadata Git dan remote `https://github.com/DaffaFirasyan/MamiTika.git`. Commit bootstrap lokal `768034a` dibuat pada `main`; perubahan aplikasi ada di branch terpisah `codex/release-preview-setup` dan belum di-commit pada saat pemeriksaan ini. Push belum berhasil karena Git Credential Manager tidak dapat membuka prompt autentikasi. GitHub belum memiliki ref remote pada pemeriksaan terakhir.
- Proyek Netlify `mamitika-dev-preview` sudah dibuat pada tim Free. GitHub App Netlify sudah dipasang dengan repository access terbatas pada `DaffaFirasyan/MamiTika`; repository tampil pada pemilih, tetapi Netlify mengonfirmasi GitHub repository masih kosong. Project belum ditautkan, environment preview belum diisi, dan belum ada deployment. URL project: `https://app.netlify.com/projects/mamitika-dev-preview`. URL `mamitika-dev-preview.netlify.app` yang dikembalikan sebagai nama situs adalah placeholder, bukan preview yang ter-deploy.
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
| AC-12 Publikasi | BELUM | Redirect, canonical, bahasa, kontak, sitemap, allowlist gambar dan data produk dicocokkan. Backup/restore, preview Netlify, performa, pemeriksaan aksesibilitas menyeluruh, URL lama dan persetujuan operasional masih tertunda. |
| AC-13 Metode dan pre-order | BELUM | Validator tanggal/metode lulus fixture; flow live menguji pengiriman. Produk aktif berstatus Ready stock, `preorder_lead_days` null; aturan pre-order dan ambil sendiri belum diuji menyeluruh. |
| AC-14 Jam dan marketplace | BELUM | Jam 06.30–17.00 WIB dikonfirmasi pemilik. Sumber menampilkan GoFood/ShopeeFood, tetapi URL toko belum ada. Hari layanan tetap kosong sesuai pemilik; maps_url database belum diisi walau tautan Maps tersedia pada sumber. |

## Tes akhir

Dijalankan dari `web/` setelah perubahan terakhir:

| Perintah | Hasil |
|---|---|
| `npm test` | PASS — 36 tes; 35 lulus, 0 gagal, 1 dilewati. Yang dilewati adalah integrasi Better Auth yang memerlukan DB lokal dan kredensial owner uji. |
| `npm run lint` | PASS — exit code 0. |
| `npm run typecheck` | PASS — `tsc --noEmit`, exit code 0. |
| `npm run build` | PASS — Next.js production build selesai; termasuk `/robots.txt` dan `/sitemap.xml`. Ini bukan bukti runtime Netlify atau integrasi auth live. |

## Backup, pemulihan, dan deployment

- Instruksi dump database, salinan objek Storage, checksum, batas pemulihan, dan rollback kode tersedia di `README.md`.
- **Backup database: GAGAL / belum valid.** Folder lokal terlindungi ACL tersedia di `C:\Users\firas\AppData\Local\Mamitika-backups\development\20261008-125146`, tetapi `supabase db dump --linked` macet saat inisialisasi login role dan dibatalkan karena prompt password DB tidak terlihat. File `schema.sql` yang dihasilkan 0 byte dan bukan backup.
- **Backup Storage: PASS parsial.** CLI mencantumkan 34 objek; operasi `supabase storage cp` gagal dengan `StorageUnsupportedOperationError`. Sebagai fallback, GET objek publik berhasil mengunduh 34 objek (3.342.050 byte) ke folder backup lokal dan SHA-256 dicatat pada `storage-sha256.csv`. Ini bukti salinan byte objek, belum backup database lengkap.
- **Restore: BELUM dilakukan.** Daftar project Supabase hanya menunjukkan project development; tidak ada target kosong terisolasi. Restore tidak dicoba dan tidak ada resource baru berbayar dibuat.
- **Netlify preview: BELUM dilakukan.** GitHub App sudah terpasang terbatas ke repo MamiTika dan repo terlihat pada Netlify. Setup project masih meminta konfigurasi lalu tombol deploy dengan branch awal `main`; tombol tersebut belum ditekan karena akan memulai deploy production. Setelah branch preview tersedia, atur base directory `web` dan environment Deploy Preview memakai Supabase development. `netlify.toml` menetapkan `npm run build` dan publish `.next`.
- Tidak ada deployment, perubahan DNS/domain, seed production, atau publikasi. Tidak ada URL deployment/version/rollback smoke test untuk dicatat.
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
- Netlify Free team tersedia. Site kosong `mamitika-dev-preview` telah dibuat dan GitHub App dengan akses terbatas repo MamiTika sudah terpasang. Netlify menunjukkan repository MamiTika kosong dan meminta code dipush sebelum koneksi. Wizard belum membuat deploy atau mengubah konfigurasi branch; Deploy Preview belum ada.
- Push Git belum berhasil karena Git tidak mendapatkan credential saat menjalankan helper lokal. Tidak ada push yang selesai. Supabase tetap development; tidak ada perubahan production atau DNS.

## Blocker pemilik sebelum publikasi

1. Minta persetujuan final pemilik atas 18 produk aktif/Ready stock di development dan tentukan isi kemasan untuk tujuh roti satuan. Pre-order belum dikonfigurasi per SKU.
2. Konfirmasi/isi tautan Maps dan URL toko GoFood/ShopeeFood jika ingin ditampilkan. WhatsApp, alamat, dan jam telah dikonfirmasi; hari layanan, catatan fulfillment, minimum/tenggat Snack Box sengaja tetap kosong.
3. Lanjutkan uji live untuk keranjang multi-item, perubahan katalog ketika cart lama tersimpan, hapus/salin fallback WhatsApp, varian frozen/matang, dan fulfillment ambil sendiri.
4. Siapkan site/repository Netlify dan Deploy Preview yang memakai Supabase development; lanjutkan uji login owner/non-owner, mutasi admin, upload, dan draft pada preview.
5. Buat backup database **dan** Storage, lalu buktikan restore di project kosong terisolasi.
6. Lengkapi pemeriksaan 375/768/1024 px, Chrome/Android dan Safari/iPhone yang tersedia, screen reader, kontras, zoom 200%, performa, dan persetujuan visual pemilik.
7. Ulangi smoke test preview. Publikasi, production credentials, domain/DNS, dan seed production memerlukan keputusan/otorisasi terpisah.

Website belum siap dipublikasikan.
