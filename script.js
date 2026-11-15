const wadahKatalog = document.getElementById('tempat-katalog-js');
const wadahNewRelease = document.getElementById('tempat-new-release');

// MASUKKAN KUNCI API TMDB ANDA DI SINI
const TMDB_API_KEY = '36808a649f41364d701e46a1dd886912';

// --- 0. REGISTRASI SERVICE WORKER & INSTALASI APLIKASI HP (PWA) ---
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.warn('Service Worker dilewati:', err);
        });
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('banner-install');
    if (banner) banner.style.display = 'flex';
});

async function instalAplikasiHP() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('banner-install').style.display = 'none';
        }
        deferredPrompt = null;
    } else {
        alert(
            "Cara Install DecaStream di HP:\n\n" +
            "• Android (Chrome): Ketuk ikon titik tiga (⋮) di pojok kanan atas browser, lalu pilih 'Tambahkan ke Layar Utama' / 'Install App'.\n" +
            "• iPhone (Safari): Ketuk ikon Bagikan (kotak panah ke atas), lalu pilih 'Add to Home Screen'."
        );
    }
}

// --- 1. FUNGSI PENCETAK KARTU HTML ---
function buatElemenKartu(judul, gambar, tahun, kategoriKatalog, targetWadah = wadahKatalog) {
    if (!targetWadah) return;
    const urlJudul = encodeURIComponent(judul);
    const classKategori = kategoriKatalog.toLowerCase().replace(/\s+/g, '-');

    const elemenKartu = `
        <div class="kartu-film ${classKategori}">
            <a href="detail.html?judul=${urlJudul}">
                <img src="${gambar}" class="gambar-poster" alt="${judul}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x420/1b1726/a88beb?text=${urlJudul}'">
            </a>
            <span class="tahun">${tahun}</span>
            <h3>${judul}</h3>
        </div>
    `;
    targetWadah.insertAdjacentHTML('beforeend', elemenKartu);
}

// --- 2. AMBIL DATA NEW RELEASE ---
async function muatNewRelease() {
    if (!wadahNewRelease || TMDB_API_KEY === 'MASUKKAN_API_KEY_ANDA_DI_SINI') return;
    wadahNewRelease.innerHTML = "";

    const judulTerbaru = [
        "Kamen Rider Gavv",
        "Ultraman Arc",
        "No.1 Sentai Gozyuger",
        "Bakuage Sentai Boonboomger",
        "Kamen Rider Zeztz",
        "Ultraman Omega"
    ];

    const hasil = await Promise.all(
        judulTerbaru.map(async (judul) => {
            try {
                const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(judul)}`);
                const data = await res.json();
                return data.results ? data.results.find(item => item.poster_path !== null) : null;
            } catch {
                return null;
            }
        })
    );

    hasil.forEach(film => {
        if (film) {
            buatElemenKartu(
                film.name,
                `https://image.tmdb.org/t/p/w500${film.poster_path}`,
                film.first_air_date ? film.first_air_date.substring(0, 4) : "2026",
                "New Release",
                wadahNewRelease
            );
        }
    });
}

// --- 3. AMBIL DATA TOKUSATSU DARI TMDB ---
async function ambilDataTokusatsu(kataKunci, jumlahMaksimal = 16) {
    try {
        const [res1, res2] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(kataKunci)}&page=1`),
            fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(kataKunci)}&page=2`)
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();

        const gabunganHasil = [...(data1.results || []), ...(data2.results || [])];
        const filmValid = gabunganHasil.filter(film => film.poster_path !== null && film.first_air_date);

        filmValid.sort((a, b) => new Date(b.first_air_date) - new Date(a.first_air_date));

        filmValid.slice(0, jumlahMaksimal).forEach(film => {
            buatElemenKartu(
                film.name,
                `https://image.tmdb.org/t/p/w500${film.poster_path}`,
                film.first_air_date.substring(0, 4),
                kataKunci
            );
        });
    } catch (error) {
        console.error(`Gagal memuat ${kataKunci}:`, error);
    }
}

// --- 4. AMBIL DATA KATEGORI "OTHER" ---
async function ambilDataOther() {
    const daftarJudulOther = [
        "Garo",
        "Madan Senki Ryukendo",
        "Chouseishin Gransazer",
        "Genseishin Justirisers",
        "Chousei Kantai Sazer-X",
        "Kamen Rider Black Sun",
        "Kamen Rider Amazons"
    ];

    const hasil = await Promise.all(
        daftarJudulOther.map(async (judul) => {
            try {
                const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(judul)}`);
                const data = await res.json();
                return data.results ? data.results.find(item => item.poster_path !== null) : null;
            } catch {
                return null;
            }
        })
    );

    hasil.forEach(film => {
        if (film) {
            buatElemenKartu(
                film.name,
                `https://image.tmdb.org/t/p/w500${film.poster_path}`,
                film.first_air_date ? film.first_air_date.substring(0, 4) : "TBA",
                "Other"
            );
        }
    });
}

// --- 5. AMBIL DATA ANIME DARI TMDB ---
async function ambilDataAnimeTMDB(jumlahMaksimal = 16) {
    try {
        const respon = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc&page=1`);
        const dataMentah = await respon.json();

        const animeValid = (dataMentah.results || []).filter(film => film.poster_path !== null).slice(0, jumlahMaksimal);

        animeValid.forEach(film => {
            buatElemenKartu(
                film.name,
                `https://image.tmdb.org/t/p/w500${film.poster_path}`,
                film.first_air_date ? film.first_air_date.substring(0, 4) : "TBA",
                "Anime"
            );
        });
    } catch (error) {
        console.error("Gagal memuat Anime:", error);
    }
}

// --- 6. KATALOG CADANGAN JIKA JARINGAN HP MEMBLOKIR TMDB ---
function muatKatalogCadangan() {
    const dataCadangan = [
        { judul: "Ultraman Arc", tahun: "2024", kategori: "Ultraman", poster: "https://via.placeholder.com/300x420/1b1726/a88beb?text=Ultraman+Arc" },
        { judul: "Kamen Rider Gavv", tahun: "2024", kategori: "Kamen Rider", poster: "https://via.placeholder.com/300x420/1b1726/a88beb?text=Kamen+Rider+Gavv" },
        { judul: "Bakuage Sentai Boonboomger", tahun: "2024", kategori: "Super Sentai", poster: "https://via.placeholder.com/300x420/1b1726/a88beb?text=Boonboomger" },
        { judul: "Power Rangers Cosmic Fury", tahun: "2023", kategori: "Power Rangers", poster: "https://via.placeholder.com/300x420/1b1726/a88beb?text=Cosmic+Fury" },
        { judul: "Garo", tahun: "2005", kategori: "Other", poster: "https://via.placeholder.com/300x420/1b1726/a88beb?text=Garo" },
        { judul: "Sousou no Frieren", tahun: "2023", kategori: "Anime", poster: "https://via.placeholder.com/300x420/1b1726/a88beb?text=Frieren" }
    ];

    wadahKatalog.innerHTML = `<p style="grid-column: 1 / -1; color: #c5b3f7; font-size: 13px; margin-bottom: 5px;">⚠️ Koneksi ke server TMDB terhambat di jaringan seluler Anda. Menampilkan mode katalog ringan:</p>`;
    dataCadangan.forEach(item => buatElemenKartu(item.judul, item.poster, item.tahun, item.kategori));
}

// --- 7. FUNGSI FILTER KATEGORI ---
function saringFilm(kategoriPilihan, tombolDiklik) {
    if (tombolDiklik) {
        document.querySelectorAll('#wadah-filter button').forEach(btn => btn.classList.remove('aktif'));
        tombolDiklik.classList.add('aktif');
    }

    const semuaKartu = document.querySelectorAll('#tempat-katalog-js .kartu-film');
    semuaKartu.forEach(kartu => {
        if (kategoriPilihan === 'Semua') {
            kartu.style.display = '';
        } else {
            const classDicari = kategoriPilihan.toLowerCase().replace(/\s+/g, '-');
            kartu.style.display = kartu.classList.contains(classDicari) ? '' : 'none';
        }
    });
}

// --- 8. MUAT SEMUA DATABASE SECARA PARALEL (CEPAT DI HP) ---
async function muatSemuaKatalog() {
    if (!wadahKatalog) return;

    if (TMDB_API_KEY === 'MASUKKAN_API_KEY_ANDA_DI_SINI') {
        muatKatalogCadangan();
        return;
    }

    wadahKatalog.innerHTML = `<p id="teks-loading" style="grid-column: 1 / -1; color: #c5b3f7;">Memuat katalog DecaStream...</p>`;

    await Promise.all([
        ambilDataTokusatsu("Kamen Rider", 16),
        ambilDataTokusatsu("Ultraman", 16),
        ambilDataTokusatsu("Super Sentai", 16),
        ambilDataTokusatsu("Power Rangers", 12),
        ambilDataOther(),
        ambilDataAnimeTMDB(16)
    ]);

    const teksLoading = document.getElementById('teks-loading');
    if (teksLoading) teksLoading.remove();

    // Jika jaringan HP memblokir TMDB sehingga tidak ada 1 pun kartu yang muncul, tampilkan cadangan
    if (wadahKatalog.children.length === 0) {
        muatKatalogCadangan();
    }
}

// --- 9. FITUR BOOKMARK & HISTORY ---
function kembaliKeBeranda() {
    document.getElementById('bagian-new-release').style.display = 'block';
    document.getElementById('judul-halaman').innerText = "Katalog Series";
    document.getElementById('wadah-filter').style.display = 'flex';
    
    const tombolSemua = document.querySelector('#wadah-filter button');
    if (tombolSemua) {
        document.querySelectorAll('#wadah-filter button').forEach(btn => btn.classList.remove('aktif'));
        tombolSemua.classList.add('aktif');
    }

    muatNewRelease();
    muatSemuaKatalog();
}

function tampilkanBookmark() {
    document.getElementById('bagian-new-release').style.display = 'none';
    document.getElementById('judul-halaman').innerText = "⭐ Bookmark Saya";
    document.getElementById('wadah-filter').style.display = 'none';
    wadahKatalog.innerHTML = "";

    const dataBookmark = JSON.parse(localStorage.getItem('playsatsu_bookmark')) || [];

    if (dataBookmark.length === 0) {
        wadahKatalog.innerHTML = "<p style='grid-column: 1 / -1; color: #aaa;'>Belum ada seri yang disimpan di Bookmark.</p>";
        return;
    }

    dataBookmark.forEach(item => {
        const urlJudul = encodeURIComponent(item.judul);
        wadahKatalog.innerHTML += `
            <div class="kartu-film">
                <a href="detail.html?judul=${urlJudul}">
                    <img src="${item.poster}" class="gambar-poster" alt="${item.judul}">
                </a>
                <span class="tahun">${item.tahun}</span>
                <h3>${item.judul}</h3>
                <button onclick="hapusBookmark('${item.judul.replace(/'/g, "\\'")}')" style="margin-top: 8px; padding: 5px 10px; background: #e53935; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Hapus</button>
            </div>
        `;
    });
}

function hapusBookmark(judulHapus) {
    let dataBookmark = JSON.parse(localStorage.getItem('playsatsu_bookmark')) || [];
    dataBookmark = dataBookmark.filter(item => item.judul !== judulHapus);
    localStorage.setItem('playsatsu_bookmark', JSON.stringify(dataBookmark));
    tampilkanBookmark();
}

function tampilkanHistory() {
    document.getElementById('bagian-new-release').style.display = 'none';
    document.getElementById('judul-halaman').innerText = "🕒 Riwayat Tontonan (History)";
    document.getElementById('wadah-filter').style.display = 'none';
    wadahKatalog.innerHTML = "";

    const dataHistory = JSON.parse(localStorage.getItem('playsatsu_history')) || [];

    if (dataHistory.length === 0) {
        wadahKatalog.innerHTML = "<p style='grid-column: 1 / -1; color: #aaa;'>Belum ada riwayat tontonan.</p>";
        return;
    }

    dataHistory.forEach(item => {
        const urlJudul = encodeURIComponent(item.judul);
        wadahKatalog.innerHTML += `
            <div class="kartu-film">
                <a href="detail.html?judul=${urlJudul}">
                    <img src="${item.poster}" class="gambar-poster" alt="${item.judul}">
                </a>
                <span class="tahun" style="background: #a88beb; color: #121018; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${item.infoEpisode}</span>
                <h3 style="margin-top: 8px;">${item.judul}</h3>
            </div>
        `;
    });
}

// Jalankan saat halaman dibuka
muatNewRelease();
muatSemuaKatalog();