// --- LOGIKA DETAIL FILM, PEMUTAR HYBRID & FITUR MARATHON ---
const TMDB_API_KEY = '36808a649f41364d701e46a1dd886912'; // WAJIB ISI API KEY TMDB ANDA

const paramUrl = new URLSearchParams(window.location.search);
const judulDicari = paramUrl.get('judul');

let infoSeriAktif = {
    id: null,
    judul: judulDicari || "Memuat Judul...",
    poster: "https://via.placeholder.com/200x280/1b1726/a88beb?text=DecaStream",
    tahun: "TBA",
    youtubeKeyBawaan: null
};

let statusPutar = {
    season: 1,
    episode: 1,
    server: 1
};

let daftarEpisodeAktif = [];
const videoMp4Default = "https://www.w3schools.com/html/mov_bbb.mp4";

// --- 1. PENGOLAH LINK OTOMATIS (YOUTUBE & GOOGLE DRIVE) ---
function formatLinkOtomatis(url) {
    if (!url || typeof url !== 'string') return null;
    const linkBersih = url.trim();

    // YouTube (watch?v=..., youtu.be/..., shorts/...)
    if (linkBersih.includes('youtube.com/watch')) {
        try {
            const videoId = new URL(linkBersih).searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}` : linkBersih;
        } catch {
            return linkBersih;
        }
    }
    if (linkBersih.includes('youtu.be/')) {
        const videoId = linkBersih.split('youtu.be/')[1].split(/[?&]/)[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    if (linkBersih.includes('youtube.com/shorts/')) {
        const videoId = linkBersih.split('youtube.com/shorts/')[1].split(/[?&]/)[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }

    // Google Drive (.../file/d/ID_FILE/...)
    if (linkBersih.includes('drive.google.com/file/d/')) {
        const match = linkBersih.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        return match ? `https://drive.google.com/file/d/${match[1]}/preview` : linkBersih;
    }

    return linkBersih;
}

// Mencari data seri di episodes.js tanpa mempedulikan huruf besar/kecil
function cariSeriDiDatabase(judul) {
    const db = (typeof databaseEpisode !== 'undefined') ? databaseEpisode : {};
    const kunciCocok = Object.keys(db).find(
        k => k.trim().toLowerCase() === judul.trim().toLowerCase()
    );
    return kunciCocok ? db[kunciCocok] : null;
}

function dapatkanSumberVideo(judul, season, episode) {
    const dataSeri = cariSeriDiDatabase(judul);
    if (!dataSeri || !dataSeri[season]) return null;

    const dataSeason = dataSeri[season];
    const linkMentah = Array.isArray(dataSeason)
        ? dataSeason[episode - 1]
        : dataSeason[episode];

    return formatLinkOtomatis(linkMentah);
}

// --- 2. FUNGSI PEMUTAR VIDEO ---
function muatPemutarVideo() {
    const wadahPemutar = document.querySelector('.pemutar-video');
    if (!wadahPemutar) return;

    if (window.videojs && videojs.getPlayers()['my-video']) {
        videojs.getPlayers()['my-video'].dispose();
    }

    const linkKustom = dapatkanSumberVideo(infoSeriAktif.judul, statusPutar.season, statusPutar.episode);
    const pakaiModeIframe = (linkKustom && !linkKustom.endsWith('.mp4') && !linkKustom.endsWith('.m3u8')) || statusPutar.server === 2;

    if (pakaiModeIframe) {
        let urlIframe = "";
        if (linkKustom) {
            urlIframe = linkKustom;
        } else if (infoSeriAktif.youtubeKeyBawaan) {
            urlIframe = `https://www.youtube.com/embed/${infoSeriAktif.youtubeKeyBawaan}?rel=0`;
        } else {
            wadahPemutar.innerHTML = `
                <div style="height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #aaa; text-align: center; padding: 20px;">
                    <p style="font-size: 16px; margin-bottom: 10px;">Video YouTube/Embed belum tersedia untuk episode ini.</p>
                    <p style="font-size: 13px;">Silakan klik tombol <strong>Server 1 (Video.js)</strong> di bawah.</p>
                </div>
            `;
            return;
        }

        wadahPemutar.innerHTML = `
            <iframe 
                src="${urlIframe}" 
                allowfullscreen 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
            </iframe>
        `;
    } else {
        const sumberMp4 = (linkKustom && (linkKustom.endsWith('.mp4') || linkKustom.endsWith('.m3u8')))
            ? linkKustom
            : videoMp4Default;

        wadahPemutar.innerHTML = `
            <video
                id="my-video"
                class="video-js vjs-big-play-centered vjs-theme-sea"
                controls
                preload="auto"
            ></video>
        `;

        const player = videojs('my-video', {
            autoplay: false,
            fluid: true,
            userActions: {
                doubleClick: function(event) {
                    const pemutar = this;
                    const layar = pemutar.el();
                    const lebarLayar = layar.offsetWidth;
                    const posisiLayar = layar.getBoundingClientRect();
                    
                    const posisiKlikX = event.clientX - posisiLayar.left;
                    const waktuSaatIni = pemutar.currentTime();
                    
                    if (posisiKlikX < lebarLayar / 2) {
                        pemutar.currentTime(waktuSaatIni - 10);
                        tampilkanAnimasiLompat("⏪ -10d");
                    } else {
                        pemutar.currentTime(waktuSaatIni + 10);
                        tampilkanAnimasiLompat("+10d ⏩");
                    }
                }
            }
        });

        const tipe = sumberMp4.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4';
        player.src({ type: tipe, src: sumberMp4 });
    }
}

function tampilkanAnimasiLompat(teks) {
    const infoJump = document.createElement('div');
    infoJump.innerText = teks;
    infoJump.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 30px; font-weight: bold; text-shadow: 2px 2px 5px black; z-index: 999; pointer-events: none;';
    document.querySelector('.pemutar-video').appendChild(infoJump);
    setTimeout(() => infoJump.remove(), 500);
}

// --- 3. KONTROL MARATHON & PEMILIH SERVER ---
function pasangKontrolPemutar() {
    if (document.getElementById('wadah-kontrol-pemutar')) return;

    const wadahPemutar = document.querySelector('.pemutar-video');
    const kontrolWrapper = document.createElement('div');
    kontrolWrapper.id = 'wadah-kontrol-pemutar';

    kontrolWrapper.innerHTML = `
        <div class="bar-marathon">
            <button id="btn-prev-eps" class="btn-marathon" disabled>⏮ Eps Sebelumnya</button>
            <button id="btn-next-eps" class="btn-marathon" disabled>Eps Selanjutnya ⏭</button>
        </div>
        <div id="wadah-server" style="display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap;">
            <span style="font-size: 14px; color: #aaa;">Pilih Server:</span>
            <button class="btn-server" data-server="1" style="padding: 6px 14px; background: #a88beb; color: #121018; font-weight: bold; border: none; border-radius: 5px; cursor: pointer;">Server 1 (Video.js)</button>
            <button class="btn-server" data-server="2" style="padding: 6px 14px; background: #241e33; color: white; border: none; border-radius: 5px; cursor: pointer;">Server 2 (YouTube / Embed)</button>
        </div>
    `;

    wadahPemutar.insertAdjacentElement('afterend', kontrolWrapper);

    document.querySelectorAll('.btn-server').forEach(btn => {
        btn.onclick = () => {
            statusPutar.server = parseInt(btn.getAttribute('data-server'));
            document.querySelectorAll('.btn-server').forEach(b => {
                const aktif = parseInt(b.getAttribute('data-server')) === statusPutar.server;
                b.style.background = aktif ? '#a88beb' : '#241e33';
                b.style.color = aktif ? '#121018' : 'white';
                b.style.fontWeight = aktif ? 'bold' : 'normal';
            });
            muatPemutarVideo();
        };
    });

    document.getElementById('btn-prev-eps').onclick = () => {
        if (statusPutar.episode > 1) pilihDanPutarEpisode(statusPutar.episode - 1);
    };

    document.getElementById('btn-next-eps').onclick = () => {
        if (statusPutar.episode < daftarEpisodeAktif.length) pilihDanPutarEpisode(statusPutar.episode + 1);
    };
}

function perbaruiTombolMarathon() {
    const btnPrev = document.getElementById('btn-prev-eps');
    const btnNext = document.getElementById('btn-next-eps');
    if (!btnPrev || !btnNext) return;

    btnPrev.disabled = statusPutar.episode <= 1;
    btnNext.disabled = statusPutar.episode >= daftarEpisodeAktif.length || daftarEpisodeAktif.length === 0;
}

function pilihDanPutarEpisode(nomorEpisode) {
    const epsObj = daftarEpisodeAktif.find(e => e.episode_number === nomorEpisode);
    if (!epsObj) return;

    statusPutar.episode = nomorEpisode;

    document.querySelectorAll('.tombol-eps').forEach(btn => {
        const isTerpilih = parseInt(btn.getAttribute('data-eps')) === nomorEpisode;
        btn.style.backgroundColor = isTerpilih ? '#a88beb' : '#241e33';
        btn.style.color = isTerpilih ? '#121018' : 'white';
        btn.style.fontWeight = isTerpilih ? 'bold' : 'normal';
    });

    const statusEpisode = document.getElementById('status-episode-aktif');
    if (statusEpisode) {
        statusEpisode.innerText = `Sedang Diputar: S${statusPutar.season} Eps ${epsObj.episode_number} - ${epsObj.name}`;
    }

    perbaruiTombolMarathon();
    catatKeHistory(statusPutar.season, epsObj.episode_number);
    muatPemutarVideo();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Jalankan pemutar langsung saat halaman dibuka
pasangKontrolPemutar();
muatPemutarVideo();

// --- 4. MENGAMBIL DATA SERI & SEASON DARI TMDB ---
if (judulDicari) {
    document.getElementById('judul-detail').innerText = judulDicari;
    ambilDetailFilm(judulDicari);
}

async function ambilDetailFilm(judul) {
    if (TMDB_API_KEY === 'MASUKKAN_API_KEY_ANDA_DI_SINI') {
        pasangTombolBookmark();
        muatEpisodeDariDatabaseLokal();
        return;
    }

    try {
        const responCari = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(judul)}`);
        const dataCari = await responCari.json();

        if (dataCari.results && dataCari.results.length > 0) {
            const idFilm = dataCari.results[0].id;
            
            const [responDetail, responVideo] = await Promise.all([
                fetch(`https://api.themoviedb.org/3/tv/${idFilm}?api_key=${TMDB_API_KEY}`),
                fetch(`https://api.themoviedb.org/3/tv/${idFilm}/videos?api_key=${TMDB_API_KEY}`)
            ]);

            const dataDetail = await responDetail.json();
            const dataVideo = await responVideo.json();
            const videoYoutube = (dataVideo.results || []).find(v => v.site === "YouTube");

            infoSeriAktif = {
                id: idFilm,
                judul: dataDetail.name || judul,
                poster: dataDetail.poster_path ? `https://image.tmdb.org/t/p/w500${dataDetail.poster_path}` : infoSeriAktif.poster,
                tahun: dataDetail.first_air_date ? dataDetail.first_air_date.substring(0, 4) : "TBA",
                youtubeKeyBawaan: videoYoutube ? videoYoutube.key : null
            };

            document.getElementById('judul-detail').innerText = infoSeriAktif.judul;
            document.getElementById('kategori-detail').innerText = dataDetail.genres.map(g => g.name).join(', ') || "Tokusatsu / Anime";
            document.getElementById('tahun-detail').innerText = infoSeriAktif.tahun;
            
            const sinopsis = dataDetail.overview ? dataDetail.overview : "Sinopsis belum tersedia untuk seri ini.";
            document.querySelector('.info-film p:last-child').innerHTML = `<strong>Sinopsis:</strong> ${sinopsis}`;

            pasangTombolBookmark();
            siapkanWadahEpisode(dataDetail.seasons || []);
        } else {
            // Fallback jika seri tidak ada di TMDB, ambil episode dari episodes.js
            document.getElementById('kategori-detail').innerText = "Tokusatsu / Series";
            document.getElementById('tahun-detail').innerText = "2026";
            document.querySelector('.info-film p:last-child').innerHTML = `<strong>Sinopsis:</strong> Tayangan tersedia di DecaStream.`;
            pasangTombolBookmark();
            muatEpisodeDariDatabaseLokal();
        }
    } catch (error) {
        console.error("Gagal mengambil detail:", error);
        pasangTombolBookmark();
        muatEpisodeDariDatabaseLokal();
    }
}

// --- 5. FITUR BOOKMARK ---
function pasangTombolBookmark() {
    if (document.getElementById('btn-bookmark')) return;

    const btnBookmark = document.createElement('button');
    btnBookmark.id = 'btn-bookmark';
    btnBookmark.style.cssText = 'padding: 8px 16px; border: none; border-radius: 20px; cursor: pointer; font-weight: bold; margin: 10px 0; transition: 0.2s;';

    const perbaruiTampilanTombol = () => {
        const daftarBookmark = JSON.parse(localStorage.getItem('playsatsu_bookmark')) || [];
        const sudahDisimpan = daftarBookmark.some(item => item.judul === infoSeriAktif.judul);

        if (sudahDisimpan) {
            btnBookmark.innerText = "✅ Tersimpan di Bookmark";
            btnBookmark.style.backgroundColor = "#a88beb";
            btnBookmark.style.color = "#121018";
        } else {
            btnBookmark.innerText = "⭐ Simpan ke Bookmark";
            btnBookmark.style.backgroundColor = "#241e33";
            btnBookmark.style.color = "white";
        }
    };

    btnBookmark.onclick = () => {
        let daftarBookmark = JSON.parse(localStorage.getItem('playsatsu_bookmark')) || [];
        const indeks = daftarBookmark.findIndex(item => item.judul === infoSeriAktif.judul);

        if (indeks > -1) daftarBookmark.splice(indeks, 1);
        else daftarBookmark.unshift(infoSeriAktif);

        localStorage.setItem('playsatsu_bookmark', JSON.stringify(daftarBookmark));
        perbaruiTampilanTombol();
    };

    perbaruiTampilanTombol();
    document.getElementById('judul-detail').insertAdjacentElement('afterend', btnBookmark);
}

// --- 6. CATAT OTOMATIS KE HISTORY ---
function catatKeHistory(nomorSeason, nomorEpisode) {
    let daftarHistory = JSON.parse(localStorage.getItem('playsatsu_history')) || [];
    daftarHistory = daftarHistory.filter(item => item.judul !== infoSeriAktif.judul);

    daftarHistory.unshift({
        judul: infoSeriAktif.judul,
        poster: infoSeriAktif.poster,
        tahun: infoSeriAktif.tahun,
        infoEpisode: `S${nomorSeason} • Eps ${nomorEpisode}`
    });

    localStorage.setItem('playsatsu_history', JSON.stringify(daftarHistory.slice(0, 20)));
}

// --- 7. SEASON SELECTOR & DAFTAR EPISODE ---
function siapkanWadahEpisode(daftarSeasons) {
    const infoFilmDiv = document.querySelector('.info-film');
    if (document.getElementById('wadah-kontrol-episode')) return;

    const seasonsValid = daftarSeasons.filter(s => s.season_number >= 1);
    const listSeasonFinal = seasonsValid.length > 0 ? seasonsValid : daftarSeasons;

    const statusEpisode = document.createElement('p');
    statusEpisode.id = 'status-episode-aktif';
    statusEpisode.style.cssText = 'color: #c5b3f7; font-weight: bold; margin: 10px 0; font-size: 16px;';
    document.getElementById('btn-bookmark').insertAdjacentElement('afterend', statusEpisode);

    const wadahKontrol = document.createElement('div');
    wadahKontrol.id = 'wadah-kontrol-episode';
    wadahKontrol.style.marginTop = '20px';

    let htmlDropdown = '';
    if (listSeasonFinal.length > 0) {
        const opsiSeason = listSeasonFinal.map(s => 
            `<option value="${s.season_number}">${s.name} (${s.episode_count} Eps)</option>`
        ).join('');

        htmlDropdown = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px; flex-wrap: wrap;">
                <h3 style="margin: 0;">Daftar Episode:</h3>
                <select id="pilih-season" style="padding: 8px 12px; background-color: #241e33; color: white; border: 1px solid #a88beb; border-radius: 5px; font-size: 14px; cursor: pointer;">
                    ${opsiSeason}
                </select>
            </div>
        `;
    } else {
        htmlDropdown = `<h3>Daftar Episode:</h3>`;
    }

    wadahKontrol.innerHTML = htmlDropdown + `<div id="grid-episode" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>`;
    infoFilmDiv.appendChild(wadahKontrol);

    const selectSeason = document.getElementById('pilih-season');
    if (selectSeason) {
        selectSeason.addEventListener('change', (e) => {
            muatEpisodePerSeason(infoSeriAktif.id, parseInt(e.target.value));
        });
        muatEpisodePerSeason(infoSeriAktif.id, listSeasonFinal[0].season_number);
    }
}

async function muatEpisodePerSeason(idFilm, nomorSeason) {
    const gridEpisode = document.getElementById('grid-episode');
    const statusEpisode = document.getElementById('status-episode-aktif');
    gridEpisode.innerHTML = '<p style="color: #aaa;">Memuat daftar episode...</p>';

    try {
        const responSeason = await fetch(`https://api.themoviedb.org/3/tv/${idFilm}/season/${nomorSeason}?api_key=${TMDB_API_KEY}`);
        const dataSeason = await responSeason.json();
        daftarEpisodeAktif = (dataSeason.episodes || []).slice(0, 60);

        gridEpisode.innerHTML = "";

        if (daftarEpisodeAktif.length > 0) {
            statusPutar.season = nomorSeason;
            statusPutar.episode = 1;
            statusEpisode.innerText = `Sedang Diputar: S${nomorSeason} Eps 1 - ${daftarEpisodeAktif[0].name}`;
            
            perbaruiTombolMarathon();
            catatKeHistory(nomorSeason, 1);
            muatPemutarVideo();

            daftarEpisodeAktif.forEach((eps, index) => {
                const tombol = document.createElement('button');
                tombol.innerText = `Eps ${eps.episode_number}`;
                tombol.title = eps.name;
                tombol.className = 'tombol-eps';
                tombol.setAttribute('data-eps', eps.episode_number);

                const isPertama = index === 0;
                tombol.style.cssText = `padding: 8px 15px; background-color: ${isPertama ? '#a88beb' : '#241e33'}; color: ${isPertama ? '#121018' : 'white'}; font-weight: ${isPertama ? 'bold' : 'normal'}; border: none; border-radius: 5px; cursor: pointer; transition: 0.2s;`;

                tombol.onclick = () => pilihDanPutarEpisode(eps.episode_number);
                gridEpisode.appendChild(tombol);
            });
        } else {
            muatEpisodeDariDatabaseLokal();
        }
    } catch (error) {
        console.error("Gagal memuat episode season:", error);
        muatEpisodeDariDatabaseLokal();
    }
}

// Fallback pembuat tombol episode langsung dari episodes.js jika TMDB tidak memiliki datanya
function muatEpisodeDariDatabaseLokal() {
    const dataSeri = cariSeriDiDatabase(infoSeriAktif.judul);
    if (!dataSeri || !dataSeri[1]) return;

    const daftarLink = Array.isArray(dataSeri[1]) ? dataSeri[1] : Object.values(dataSeri[1]);
    daftarEpisodeAktif = daftarLink.map((_, i) => ({
        episode_number: i + 1,
        name: `Episode ${i + 1}`
    }));

    const infoFilmDiv = document.querySelector('.info-film');
    if (!document.getElementById('wadah-kontrol-episode')) {
        const statusEpisode = document.createElement('p');
        statusEpisode.id = 'status-episode-aktif';
        statusEpisode.style.cssText = 'color: #c5b3f7; font-weight: bold; margin: 10px 0; font-size: 16px;';
        document.getElementById('btn-bookmark').insertAdjacentElement('afterend', statusEpisode);

        const wadahKontrol = document.createElement('div');
        wadahKontrol.id = 'wadah-kontrol-episode';
        wadahKontrol.style.marginTop = '20px';
        wadahKontrol.innerHTML = `<h3>Daftar Episode:</h3><div id="grid-episode" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>`;
        infoFilmDiv.appendChild(wadahKontrol);
    }

    const gridEpisode = document.getElementById('grid-episode');
    gridEpisode.innerHTML = "";
    statusPutar.season = 1;
    statusPutar.episode = 1;
    document.getElementById('status-episode-aktif').innerText = `Sedang Diputar: S1 Eps 1`;

    perbaruiTombolMarathon();
    catatKeHistory(1, 1);
    muatPemutarVideo();

    daftarEpisodeAktif.forEach((eps, index) => {
        const tombol = document.createElement('button');
        tombol.innerText = `Eps ${eps.episode_number}`;
        tombol.className = 'tombol-eps';
        tombol.setAttribute('data-eps', eps.episode_number);

        const isPertama = index === 0;
        tombol.style.cssText = `padding: 8px 15px; background-color: ${isPertama ? '#a88beb' : '#241e33'}; color: ${isPertama ? '#121018' : 'white'}; font-weight: ${isPertama ? 'bold' : 'normal'}; border: none; border-radius: 5px; cursor: pointer; transition: 0.2s;`;

        tombol.onclick = () => pilihDanPutarEpisode(eps.episode_number);
        gridEpisode.appendChild(tombol);
    });
}
