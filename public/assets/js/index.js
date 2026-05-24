let tripsData = [];
let allPhotos = [];
let galleryFilter = "all";

const tripsContainer = document.getElementById("trips-container");
const timelineContainer = document.getElementById("timeline-container");
const photoGrid = document.getElementById("photo-grid");

let map;

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function safeParseGallery(gallery, fallbackImage) {
  try {
    const parsed = JSON.parse(gallery);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [fallbackImage];
  } catch {
    return [fallbackImage];
  }
}

async function fetchTripsFromAPI() {
  try {
    const result = await fetchAPI("/trips");

    tripsData = (result.data || []).map((dbTrip) => ({
      id: dbTrip.slug,
      title: dbTrip.title,
      location: dbTrip.category,
      date: `${formatDate(dbTrip.start_date)} - ${formatDate(dbTrip.end_date)}`,
      timestamp: dbTrip.start_date,
      tags: [dbTrip.category],
      coords: [13.736717, 100.523186],
      coverImg: dbTrip.cover_image,
      gallery: safeParseGallery(dbTrip.gallery, dbTrip.cover_image),
    }));

    tripsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    renderTrips();
    renderTimeline();
    initGalleryData();
    renderGallery();
    initMap();
  } catch (error) {
    console.error("Error fetching trips:", error);

    if (tripsContainer) {
      tripsContainer.innerHTML = `
        <p class="text-center w-full text-gray-500">
          ไม่สามารถโหลดข้อมูลทริปได้ กรุณาตรวจสอบ API
        </p>
      `;
    }
  }
}

function renderTrips(filterTag = "all") {
  if (!tripsContainer) return;

  tripsContainer.innerHTML = "";

  const filteredTrips =
    filterTag === "all"
      ? tripsData
      : tripsData.filter((trip) => trip.tags.includes(filterTag));

  if (filteredTrips.length === 0) {
    tripsContainer.innerHTML = `
      <div class="w-full text-center py-10 text-gray-500">
        ยังไม่มีข้อมูลในหมวดหมู่นี้
      </div>
    `;
    return;
  }

  filteredTrips.forEach((trip) => {
    const card = `
      <a href="trip-detail.html?id=${trip.id}"
        class="block min-w-[280px] md:min-w-[320px] shrink-0 snap-center bg-white dark:bg-darkcard rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-xl hover:border-accent transition-all transform hover:-translate-y-1 flex flex-col">

        <div class="h-48 overflow-hidden relative shrink-0">
          <img
            src="${trip.coverImg}"
            alt="${trip.title}"
            loading="lazy"
decoding="async"
            class="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
            onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'"
          >
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between">
          <h3 class="text-lg font-bold mb-4">${trip.title}</h3>

          <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <i class="fa-solid fa-location-dot text-accent mr-2"></i>
              ${trip.location}
            </p>

            <p>
              <i class="fa-regular fa-calendar text-accent mr-2"></i>
              ${trip.date}
            </p>
          </div>
        </div>
      </a>
    `;

    tripsContainer.insertAdjacentHTML("beforeend", card);
  });
}

function renderTimeline() {
  if (!timelineContainer) return;

  if (tripsData.length === 0) {
    timelineContainer.innerHTML = `<p class="text-gray-500">ยังไม่มีข้อมูลไทม์ไลน์</p>`;
    return;
  }

  const groupedByYear = {};

  tripsData.forEach((trip) => {
    const year = trip.timestamp ? trip.timestamp.split("-")[0] : "ไม่ระบุปี";
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(trip);
  });

  let html = "";

  Object.keys(groupedByYear)
    .sort((a, b) => b - a)
    .forEach((year) => {
      const tripsHtml = groupedByYear[year]
        .map(
          (trip) => `
            <a href="trip-detail.html?id=${trip.id}"
              class="block bg-white dark:bg-darkcard p-4 rounded-xl border border-gray-200 dark:border-gray-800 mb-4 hover:border-accent transition">

              <div class="flex flex-col sm:flex-row gap-4 items-center">
                <img
                  src="${trip.coverImg}"
                  class="w-full sm:w-32 h-24 object-cover rounded-lg"
                  onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'"
                  loading="lazy"
decoding="async"
                >

                <div>
                  <h4 class="text-lg font-bold">${trip.title}</h4>
                  <p class="text-sm text-gray-500">${trip.date}</p>
                </div>
              </div>
            </a>
          `,
        )
        .join("");

      html += `
        <div class="relative pl-8 md:pl-12 mb-8">
          <div class="absolute -left-[11px] top-0 bg-accent w-5 h-5 rounded-full border-4 border-white dark:border-darkbg"></div>

          <h3 class="text-2xl font-bold text-accent mb-6">
            ปี ${year}
          </h3>

          ${tripsHtml}
        </div>
      `;
    });

  timelineContainer.innerHTML = html;
}

function initMap() {
  const mapEl = document.getElementById("real-map");
  if (!mapEl || typeof L === "undefined") return;

  if (!map) {
    map = L.map("real-map", {
      scrollWheelZoom: false,
    }).setView([13.736717, 100.523186], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
  }

  tripsData.forEach((trip) => {
    const customIcon = L.divIcon({
      className: "custom-leaflet-icon",
      html: `
        <div class="flex flex-col items-center map-pin-anim -ml-3 -mt-6">
          <i class="fa-solid fa-location-dot text-accent text-3xl"></i>
          <span class="bg-black/90 text-white text-[10px] px-2 py-0.5 rounded mt-1">
            ${trip.location}
          </span>
        </div>
      `,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    });

    L.marker(trip.coords, { icon: customIcon }).addTo(map).bindPopup(`
        <b>${trip.title}</b>
        <br>
        <a href="trip-detail.html?id=${trip.id}">
          ดูรายละเอียด
        </a>
      `);
  });
}

function initGalleryData() {
  allPhotos = [];

  tripsData.forEach((trip) => {
    trip.gallery.forEach((imgUrl) => {
      allPhotos.push({
        url: imgUrl,
        tripTitle: trip.title,
        location: trip.location,
        date: trip.date,
        tags: trip.tags,
        timestamp: trip.timestamp,
      });
    });
  });

  allPhotos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function renderGallery() {
  if (!photoGrid) return;

  photoGrid.innerHTML = "";

  const filteredPhotos =
    galleryFilter === "all"
      ? allPhotos
      : allPhotos.filter((p) => p.tags.includes(galleryFilter));

  filteredPhotos.forEach((photo) => {
    const item = `
      <div class="break-inside-avoid relative group cursor-pointer border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-4 bg-white dark:bg-darkcard p-1">

        <img
          src="${photo.url}"
          loading="lazy"
decoding="async"
          class="w-full h-auto object-cover rounded-lg"
          onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'"
        >

        <div class="absolute inset-1 rounded-lg bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <h4 class="text-white font-bold text-lg">${photo.tripTitle}</h4>
          <p class="text-gray-300 text-xs mt-1">${photo.location}</p>
        </div>
      </div>
    `;

    photoGrid.insertAdjacentHTML("beforeend", item);
  });
}

async function renderAboutSection() {
  try {
    const result = await fetchAPI("/settings");
    const data = result.data;

    if (!data) return;
    const siteName = document.getElementById("site-name");

    if (siteName) {
      siteName.textContent = data.site_name || "Miizternat Journey";
    }

    document.title = data.site_name
      ? `${data.site_name}`
      : "Miizternat Journey";

    const heroSection = document.getElementById("home");
    const heroTitle = document.getElementById("hero-title");
    const heroDescription = document.getElementById("hero-description");

    if (heroSection && data.hero_image) {
      heroSection.style.backgroundImage = `
        linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.25)),
        url('${data.hero_image}')
      `;
    }

    if (heroTitle && data.hero_title) {
      heroTitle.innerHTML = data.hero_title.replace(
        "มิสเตอร์นัต",
        `<br><span class="text-green-400">มิสเตอร์นัต</span>`,
      );
    }

    if (heroDescription && data.hero_description) {
      heroDescription.innerHTML = data.hero_description.replace(/\n/g, "<br>");
    }

    const container = document.getElementById("about-container");

    if (!container) return;

    container.innerHTML = `
      <div class="flex flex-col md:flex-row items-center gap-12 bg-white dark:bg-[#1E1E24] rounded-3xl p-8 md:p-12 shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">

        <div class="w-full md:w-2/5">
          <div class="rounded-2xl overflow-hidden aspect-[4/5] shadow-xl">
            <img
              src="${data.about_image}"
              class="w-full h-full object-cover"
              loading="lazy"
decoding="async"
              onerror="this.src='https://via.placeholder.com/600x750?text=About'"
            >
          </div>
        </div>

        <div class="w-full md:w-3/5">
          <p class="text-orange-400 font-bold tracking-widest text-sm mb-2 uppercase">
            เกี่ยวกับฉัน
          </p>

          <h2 class="text-4xl font-bold mb-6">
            สวัสดี ผมชื่อ
            <span class="text-[#2F4F4F] dark:text-orange-400">${data.about_name || ""}</span>
          </h2>

          <div class="text-gray-600 dark:text-gray-300 text-lg leading-relaxed space-y-4">
            <p>${data.about_description || ""}</p>

            <blockquote class="border-l-4 border-orange-400 pl-4 italic py-2">
              ${data.about_quote || ""}
            </blockquote>
          </div>

          <div class="mt-8">
            <a
              href="${data.donation_link || "#"}"
              target="_blank"
              class="bg-[#2F4F4F] hover:bg-[#4C7B7B] text-white font-medium py-3 px-8 rounded-full inline-flex items-center gap-2"
            >
              <i class="fa-solid fa-hand-holding-heart"></i>
              สนับสนุนทริป
            </a>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("About Error:", error);
  }
}

function initEvents() {
  document.querySelectorAll("#trip-filters .filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll("#trip-filters .filter-btn")
        .forEach((b) => b.classList.remove("active"));

      e.target.classList.add("active");
      renderTrips(e.target.dataset.filter);
    });
  });

  const htmlElement = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");

  if (localStorage.getItem("theme") === "dark") {
    htmlElement.classList.add("dark");
    if (themeIcon) {
      themeIcon.className = "fa-solid fa-sun text-yellow-400";
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      htmlElement.classList.toggle("dark");

      const isDark = htmlElement.classList.contains("dark");

      localStorage.setItem("theme", isDark ? "dark" : "light");

      if (themeIcon) {
        themeIcon.className = isDark
          ? "fa-solid fa-sun text-yellow-400"
          : "fa-solid fa-moon text-gray-700";
      }
    });
  }

  const slideLeft = document.getElementById("slide-left");
  const slideRight = document.getElementById("slide-right");

  if (slideLeft) {
    slideLeft.addEventListener("click", () => {
      tripsContainer.scrollBy({
        left: -340,
        behavior: "smooth",
      });
    });
  }

  if (slideRight) {
    slideRight.addEventListener("click", () => {
      tripsContainer.scrollBy({
        left: 340,
        behavior: "smooth",
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initEvents();
  await fetchTripsFromAPI();
  await renderAboutSection();
});
document.addEventListener("scroll", revealOnScroll);

function revealOnScroll() {
  const elements = document.querySelectorAll(".fade-up");

  elements.forEach((el) => {
    const top = el.getBoundingClientRect().top;

    if (top < window.innerHeight - 80) {
      el.classList.add("show");
    }
  });
}
