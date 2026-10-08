# DESIGN — Mamitika Bakery

**Versi:** 1.0 · **Tanggal:** 7 Oktober 2026  
**Dasar:** [PRD.md](PRD.md) · **Kontrak teknis:** [TRD.md](TRD.md) · **Implementasi:** [TASK.md](TASK.md)

Ini spesifikasi desain untuk vibecoding, bukan mockup yang sudah dirender atau diuji. Pengguna mempercayakan keputusan desain. Implementer mengikuti arahan ini dan membuat pratinjau menggunakan konten nyata sebelum menyambungkan seluruh fitur.

## 1. Arah visual

**Bakery rumahan Bandung dengan rasa editorial yang hangat.** Bayangkan katalog roti kecil yang ditata teliti: kertas krem, teks cokelat gelap, judul serif, foto dapur/produk asli, dan aksen kuning dari logo. Yang menarik perhatian adalah makanan dan komposisi halaman; dekorasi secukupnya.

Beranda mempunyai hero yang kuat, katalog yang cepat dipindai, dan bagian snack box yang terasa sebagai layanan kedua yang penting. Halaman admin memakai identitas warna yang sama dengan kepadatan lebih praktis untuk mengedit data. Seluruh copy dalam Bahasa Indonesia.

## 2. Token desain

| Token CSS | Nilai | Penggunaan |
| --- | --- | --- |
| `--paper` | `#F8F3E8` | Latar halaman. |
| `--surface` | `#FFFCF6` | Input, permukaan foto/detail. |
| `--ink` | `#2E241E` | Teks utama, tombol gelap. |
| `--muted` | `#65594F` | Deskripsi dan metadata. |
| `--butter` | `#EBC15A` | Tombol utama dan aksen. |
| `--line` | `#D8CBBB` | Pemisah dekoratif; bukan border kontrol yang penting. |
| `--control-border` | `#88776A` | Border input/kontrol. |
| `--focus` | `#684A2C` | Outline fokus 3 px, offset 3 px. |
| `--error` | `#922C2C` | Teks error dengan penjelasan. |
| `--ready-ink` / `--ready-bg` | `#315A3E` / `#E8EFE4` | Label ready stock; selalu disertai tulisan. |

Perhitungan pasangan warna awal: ink/paper **13,68:1**; muted/surface **6,63:1**; ink/butter **8,87:1**; control-border/surface **4,19:1**; focus/paper **7,29:1**; error/surface **7,83:1**. Ini pemeriksaan token, bukan audit seluruh halaman. Periksa pasangan aktual bila menambah state/overlay. Fokus pada tombol gelap menggunakan outline terang + lapisan gelap yang tetap terlihat, bukan focus token gelap langsung pada tombol gelap.

Tipografi: **Lora** 400/500 untuk judul utama/editorial; **Source Sans 3** 400/600 untuk isi, nama produk, harga, dan kontrol. Gunakan `next/font` dengan font disajikan oleh aplikasi. Fallback serif Georgia dan sans system-ui. Maksimum dua keluarga font. Harga memakai `font-variant-numeric: tabular-nums`.

| Elemen | Desktop | Mobile | Line height |
| --- | --- | --- | --- |
| Hero h1 | 60 px, max 12–15 karakter visual per baris utama | 38–42 px; 34 px pada 320 px | 1,08–1,15 |
| Judul bagian h2 | 36 px | 28 px | 1,2 |
| Judul detail | 40 px | 30 px | 1,2 |
| Nama produk | 18 px semibold | 16–18 px | 1,35 |
| Body | 18 px | 16 px | 1,55 |
| Metadata/helper | 14 px | 14 px | 1,45 |

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Lebar konten 1.200 px, margin auto. Gutter 24–32 px desktop; 16 px mobile. Ruang antarbagian 80–96 px desktop dan 48–64 px mobile. Radius kontrol 8 px, foto 12 px, panel penting 12 px. Tidak menggunakan bayangan untuk setiap kartu; garis/ruang cukup membentuk hierarchy.

## 3. Aset dan aturan foto

| Peran | Aset awal | Keputusan |
| --- | --- | --- |
| Logo | `images/14-logo-mamitika.png`, 810×303 | Salin sebagai `web/public/brand/logo.png`; pertahankan proporsi dan transparansi. Logo 15 merupakan salinan dari halaman lain, tidak perlu keduanya. |
| Hero | `images/03-roti-smokedbeef-mamitika.jpg`, 1.204×1.204 | Dipakai sebagai foto roti secara umum; caption/alt baru “Roti buatan Mamitika di atas rak pendingin”. Label file lama belum menjadi kepastian jenis SKU. |
| Layanan snack box | `images/06-snackbox-mamitika.jpg`, 1.204×1.204 | Menunjukkan kemasan asli; gunakan crop yang mempertahankan isi box. |
| Galeri | Kurasi 6–8 foto berbeda dari manifest | Tidak mengulang duplikat atau memaksa semua 38 gambar tampil. |
| Katalog | Pemetaan 18 SKU dari beranda | Harus ditinjau dalam T01; file tanpa alt tidak ditebak berdasarkan namanya. |

Path pada tabel relatif ke `mamitika-redesign-reference/`. Gambar hero dan snack box sudah dilihat saat penyusunan dokumen. Rasio hero 1:1 atau 4:5 sesuai ruang; 4:5 tidak boleh memotong makanan utama. Foto katalog 4:3, detail menampilkan versi lebih luas/intrinsik. Jangan meregangkan gambar atau memasang teks di atas makanan. `object-position` default 50% 50%, disesuaikan per foto setelah dilihat.

Hero cukup satu foto besar tanpa collage dekoratif, gradient, maupun caption yang mengklaim harga/jumlah isi. Source yang kecil/buram tetap kecil; meminta foto pengganti lebih baik daripada memperbesar hingga pecah. Format WebP produksi mengikuti TRD; foto asli tetap tersedia sebagai sumber kerja.

## 4. Struktur beranda

```text
DESKTOP
┌──────────────────────────────────────────────────────────┐
│ LOGO           Menu   Snack Box   Galeri   Kontak   [Cart] │
├──────────────────────────────────────────────────────────┤
│ BAKERY RUMAHAN · BANDUNG      │                           │
│ Roti dan kue rumahan,         │       FOTO ROTI ASLI       │
│ dari Bandung.                │                           │
│ Pengantar singkat            │                           │
│ [Lihat menu] [Pesan snack box]│                           │
├──────────────────────────────────────────────────────────┤
│ Roti →          Kue Basah →          Risoles & Lumpia →    │
├──────────────────────────────────────────────────────────┤
│ Pilihan menu                              Lihat semua →  │
│ [foto]          [foto]          [foto]          [foto]     │
│ nama/isi/harga  nama/isi/harga  nama/isi/harga  ...        │
│ [Tambah]        [Tambah]        [Tambah]        ...        │
├──────────────────────────────────────────────────────────┤
│ FOTO SNACK BOX          Snack box untuk momen bersama.   │
│                         pengantar + [Konsultasi snack box]│
├──────────────────────────────────────────────────────────┤
│ Dari dapur Mamitika        galeri foto kurasi             │
├──────────────────────────────────────────────────────────┤
│ Bandung / kontak / 06.30–17.00 WIB / kanal pemesanan       │
└──────────────────────────────────────────────────────────┘
```

Header desktop tinggi sekitar 80 px, logo lebar 150–170 px. Pemisah tipis tanpa blok besar. Keranjang berlabel **Keranjang (n)**; n adalah total unit jual, bukan total pcs di dalam kemasan. Badge boleh ditambahkan sebagai penanda jumlah, bukan statistik usaha. Header sticky sederhana; scroll-margin pada anchor menjaga judul tidak tertutup.

Hero memakai pembagian sekitar 46/54, gap 48 px. Eyebrow kecil, judul dengan line break alami, teks max 44ch. Copy awal:

> **Roti dan kue rumahan, dari Bandung.**  
> Pilihan roti, kue basah, risoles, dan lumpia untuk menemani hari Anda.

Tombol utama **Lihat menu** memakai butter/ink; tombol **Pesan snack box** outline atau text button dengan border yang terbaca. Tidak ada badge “premium”, “best seller”, “100% fresh”, atau klaim sertifikasi.

Pintasan kategori berbentuk tiga tautan editorial di antara garis horizontal, bukan tiga panel dengan ikon besar. Pilihan menu memakai 4 produk yang ditandai pemilik; saat kosong, bagian ini dilewati dan pintasan menuju katalog tetap ada. Snack box menggunakan bidang kuning pucat/krem dengan foto di kiri dan teks di kanan sehingga berbeda dari hero/kartu. Contoh judul **“Snack box untuk momen bersama.”**, dengan copy “Ceritakan tanggal acara, jumlah box, dan pilihan isi yang Anda inginkan.” Tanpa harga paket fiktif.

Galeri kecil berjudul **“Dari dapur Mamitika”**, diikuti tautan Lihat galeri. Footer mencantumkan kontak asli, lokasi, jam layanan, dan kanal marketplace yang URL-nya sudah diisi. Jangan menambah hari layanan tanpa informasi.

## 5. Halaman katalog dan detail

Katalog: judul **“Menu Mamitika”**, satu kalimat pengantar, filter **Semua / Roti / Kue Basah / Risoles & Lumpia**, lalu grid. Filter menggunakan query `?kategori=roti|kue_basah|risoles_lumpia`; URL dapat dibagikan dan tombol Back bekerja. Filter tidak membutuhkan search bar pada katalog awal.

Kartu: foto → nama yang bisa diklik → isi kemasan → baris harga/status → Tambah. Nama boleh 2–3 baris, tidak dipotong sehingga frozen/matang hilang. Isi yang kosong tidak diberi teks palsu. Pada 360 px dua kolom, harga dan tombol dapat turun ke baris sendiri. Jangan membuat seluruh kartu menjadi tombol yang membungkus tombol Tambah.

Status:

| Nilai | Label publik | Tindakan |
| --- | --- | --- |
| `ready` | Ready stock | Tambah aktif, konfirmasi final tetap di WhatsApp. |
| `preorder` | Pre-order | Tambah aktif; informasi tenggat tampil hanya bila diketahui. |
| `unconfirmed` | Konfirmasi ketersediaan | Tambah aktif dengan helper singkat. |
| `unavailable` | Tidak tersedia | Tambah disabled, alasan dalam teks. |

Detail desktop: breadcrumb → foto kiri sekitar 55% → informasi kanan. Harga/isi tampil sebelum deskripsi panjang, kontrol jumlah dan CTA dekat informasi tersebut. Mobile: breadcrumb → nama → foto → harga/isi/status → deskripsi → jumlah/CTA. Foto detail dapat dibuka lebih besar; tetap ada caption/alt yang tepat.

Contoh presentasi Soes: **Soes**, **Isi 8 pcs per kemasan**, **Rp32.000 / kemasan**. Jumlah 2 artinya 2 kemasan. Untuk SKU tanpa unit terverifikasi, tampilkan harga dengan label **harga satu unit jual** dan deskripsi asli; jangan mengubahnya menjadi per pcs otomatis.

## 6. Keranjang dan konsultasi snack box

Keranjang desktop: daftar item kiri, ringkasan kanan sekitar 360 px. Ringkasan tidak perlu melekat bila berisiko menutupi footer. Mobile: daftar → pilihan metode/tanggal/catatan → ringkasan → tombol lanjut.

Setiap item: thumbnail 72–88 px, nama termasuk varian, isi, harga unit, kontrol minus/input/plus, subtotal, Hapus. Minus tidak boleh menghapus diam-diam; jumlah minimum 1 dan penghapusan melalui Hapus. Kontrol utama minimal 44 px tinggi. Teks status dan error diletakkan pada item terkait.

Metode memakai radio **Pengiriman / Ambil sendiri / Belum ditentukan**. Default **Belum ditentukan** agar sistem tidak menebak pilihan pelanggan; pengiriman berada pertama. Lokasi ringkas opsional saat pengiriman. Tanggal yang diinginkan muncul dan wajib ketika ada produk pre-order, memakai date input native. Catatan opsional disertai penghitung/batas 500 karakter.

Subtotal diberi label **“Subtotal produk”** dan helper **“Ongkir, ketersediaan, dan total akhir dikonfirmasi melalui WhatsApp.”** Setelah data terbaru valid, pratinjau pesan tersedia di halaman yang sama, lalu **Lanjut ke WhatsApp**. Pratinjau merupakan langkah di halaman, bukan modal wajib. Tombol Salin ringkasan tetap tersedia. Jangan menampilkan layar Pesanan berhasil.

Snack box: banner editorial dengan foto nyata, informasi konsultasi, lalu form satu kolom max 680 px. Semua field/validasi mengikuti TRD. Label tanggal dan jumlah wajib terlihat jelas. Tombol **Tinjau permintaan**, setelah valid tampil teks permintaan dan **Lanjut ke WhatsApp**. Helper menjelaskan paket/harga/jadwal akan dikonfirmasi. Form tidak dicampur dengan keranjang belanja.

## 7. Galeri, kontak, dan admin

Galeri: heading, satu pengantar faktual, grid 2 kolom mobile dan 3 desktop. Rasio foto sesuai isi; untuk awal square mudah konsisten. Tidak perlu masonry atau library. Lightbox memakai `<dialog>` native yang diuji, tombol Tutup 44 px, Escape, caption, dan fokus kembali ke thumbnail. Tidak ada autoplay.

Kontak: lokasi, jam **06.30–17.00 WIB**, WhatsApp, Instagram, pengiriman/pickup. Tautan peta selalu tersedia; embed dimuat hanya setelah diminta. GoFood/ShopeeFood berupa tautan berlabel **Pesan di GoFood** / **Pesan di ShopeeFood**, hanya ketika URL tersedia. Tidak menggunakan logo marketplace baru tanpa aset yang benar.

Admin desktop: sidebar 224 px dengan **Produk / Galeri / Pengaturan**, area utama dengan judul dan tombol Tambah produk. Halaman awal admin langsung ke Produk, tanpa dashboard angka palsu. Daftar produk berupa tabel yang menampilkan nama, kategori, harga, status, aktif, dan Edit. Mobile memakai daftar berbaris dan tombol navigasi sederhana; tidak memaksa tabel melebar di luar layar.

Editor produk: nama/kategori → deskripsi → harga/unit/isi → status/tenggat → foto/alt/crop → pilihan beranda/aktif → pratinjau → Simpan perubahan. Harga menggunakan input angka yang berlabel rupiah. Slug produk lama readonly. Upload menampilkan foto lama dan kandidat, dengan status jelas. Simpan berhasil memberi konfirmasi; error mempertahankan input dan foto lama. Konfirmasi meninggalkan halaman hanya untuk perubahan yang belum tersimpan, menggunakan mekanisme browser bila berlaku.

Login admin menampilkan form email dan password dengan label jelas, tombol tampil/sembunyikan password yang dapat diakses keyboard, pesan error yang ringkas, dan indikator proses. Tidak ada tombol Google/OAuth, pendaftaran, atau reset password via email. Tautan **Lupa kata sandi? Hubungi operator** menjelaskan pemulihan dilakukan secara manual. Setelah login, pemilik dapat mengganti password melalui pengaturan akun. Pengaturan usaha mengelompokkan Kontak, Jam layanan, Pengiriman/pickup, Kanal marketplace, dan Snack box.

## 8. Responsif, state, dan aksesibilitas

| Lebar viewport | Katalog | Navigasi/layout |
| --- | --- | --- |
| 320–359 px | 1 kolom | Header logo 128 px + tombol Menu + Keranjang ringkas; hero satu kolom. |
| 360–767 px | 2 kolom, gap 12–16 px | Menu panel, judul wrap, semua form satu kolom. |
| 768–1.023 px | 3 kolom | Navigasi tetap panel jika label tidak muat; hero dua kolom hanya saat terbaca. |
| ≥1.024 px | 4 kolom, gap 24 px | Header lengkap, hero/detail dua kolom, container max 1.200 px. |

Mobile hero: teks → tombol → foto; foto maksimal sekitar 440 px tinggi sebelum crop dipilih. Keranjang ringkas di header cukup untuk awal, tanpa floating WhatsApp dan footer sticky tambahan yang berebut ruang. Bila tombol sticky keranjang ditambahkan setelah pemeriksaan UX, gunakan safe-area inset dan padding bawah agar tidak menutupi konten.

| State | Presentasi wajib |
| --- | --- |
| Loading | Teks “Memuat menu…” dan layout yang tidak meloncat; tidak memberi harga placeholder. |
| Empty cart | “Keranjang Anda masih kosong.” + Kembali ke menu. |
| Empty category | “Belum ada produk pada kategori ini.” + Semua menu. |
| Catalog error | “Menu belum dapat dimuat.” + Coba lagi + Hubungi Mamitika; dibedakan dari kosong. |
| Added | Status singkat “Soes ditambahkan ke keranjang”, `aria-live=polite`; tidak memaksa membuka modal. |
| Price changed | Perubahan harga ditampilkan dekat ringkasan; pengguna meninjau nilai baru. |
| Removed/unavailable | Item tetap terlihat sebagai perlu dihapus, dengan alasan; tidak ikut pesan. |
| Upload/save error | Pesan spesifik yang aman, tombol retry, isian lama tetap tersedia. |
| Missing image | Bidang foto netral dengan teks “Foto belum tersedia”; nama/harga tetap terbaca. |
| Outside service hours | Jam layanan dan penjelasan tanggapan mengikuti jam layanan; tidak menutup keranjang. |

Gunakan landmark, satu h1 tiap halaman, heading berurutan, skip link, label input, error terhubung `aria-describedby`, `aria-expanded` pada Menu, dan nama aksesibel pada tombol ikon. Keyboard harus dapat melakukan semua alur. Pembesaran teks dan reduced motion tidak memutus interaksi. Animasi hanya perubahan state ringan 120–180 ms; matikan bila reduced motion. Kontras dan fokus mengikuti PRD; tidak ada hover sebagai satu-satunya cara melihat detail.

## 9. Kriteria penilaian desain

Pratinjau desktop 1.440 px dan mobile 390/320 px memakai data asli. Lulus bila:

1. Logo, fotografi, palette, dan komposisi langsung mengidentifikasi bakery Mamitika.
2. Produk, isi, harga, serta CTA dapat dibaca cepat; kedua jalur produk/snack box mudah ditemukan.
3. Foto tidak pecah/terdistorsi atau salah mewakili SKU; nama varian tetap terbaca.
4. Header, katalog, formulir, keranjang, dan admin tetap dapat dioperasikan pada layar kecil dan dengan keyboard.
5. Tidak ada gradient teknologi, glassmorphism, bento berulang, statistik/testimoni/promosi palsu, ikon dekoratif berlebihan, atau layout seluruh bagian berupa kartu identik.

Catat hasil dengan screenshot dan ukuran viewport pada implementasi. Dokumen ini belum menyatakan desain lolos audit visual; pemeriksaan dilakukan setelah halaman dirender.
