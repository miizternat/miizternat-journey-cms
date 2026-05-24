function safeGalleryCount(gallery) {
  try {
    const parsed = JSON.parse(gallery);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
function applyDashboardThemeToDynamicCards() {
  const isLight = localStorage.getItem("adminTheme") === "light";

  if (!isLight) return;

  document.querySelectorAll(".latest-trip-card").forEach((card) => {
    card.classList.remove("bg-[#111116]", "hover:bg-white/10");
    card.classList.add("bg-slate-100", "hover:bg-slate-200");
  });
}
async function loadDashboard() {
  try {
    const result = await fetchAPI("/trips");
    const trips = result.data || [];

    const categories = new Set(trips.map((trip) => trip.category));
    const totalImages = trips.reduce((sum, trip) => {
      return sum + 1 + safeGalleryCount(trip.gallery);
    }, 0);

    document.getElementById("totalTrips").textContent = trips.length;
    document.getElementById("totalImages").textContent = totalImages;
    document.getElementById("totalCategories").textContent = categories.size;

    const latestTrips = trips.slice(0, 5);
    const container = document.getElementById("latestTrips");

    if (latestTrips.length === 0) {
      container.innerHTML = `<p class="text-gray-400">ยังไม่มีข้อมูลทริป</p>`;
      applyDashboardThemeToDynamicCards();
      return;
    }

    container.innerHTML = latestTrips

      .map(
        (trip) => `
          <a
            href="admin.html?edit=${trip.slug}"
class="latest-trip-card flex items-center gap-4 bg-[#111116] hover:bg-white/10 rounded-2xl p-4 transition"          >
            <img
              src="${trip.cover_image}"
              class="w-16 h-16 rounded-xl object-cover bg-black/30"
              onerror="this.src='https://via.placeholder.com/100'"
            />

            <div class="flex-1">
              <h4 class="font-bold">${trip.title}</h4>
              <p class="text-sm text-gray-400">
                ${trip.category} · ${formatDate(trip.start_date)}
              </p>
            </div>

            <i class="fa-solid fa-pen text-orange-400"></i>
          </a>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
