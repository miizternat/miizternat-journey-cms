function applyAdminTheme() {
  const isLight = localStorage.getItem("adminTheme") === "light";

  if (isLight) {
    document.body.classList.remove("bg-[#0F0F12]", "text-white");
    document.body.classList.add("bg-slate-50", "text-slate-900");

    document.querySelectorAll(".admin-card").forEach((el) => {
      el.classList.remove("bg-[#1E1E24]", "border-white/10");
      el.classList.add("bg-white", "border-slate-200");
    });

    document.querySelectorAll(".admin-sidebar").forEach((el) => {
      el.classList.remove("bg-[#111116]", "border-white/10");
      el.classList.add("bg-white", "border-slate-200");
    });

    document.querySelectorAll(".admin-header").forEach((el) => {
      el.classList.remove("bg-[#0F0F12]/90", "border-white/10");
      el.classList.add("bg-white/90", "border-slate-200");
    });
  }
}

function initAdminThemeToggle() {
  const toggleBtn = document.getElementById("admin-theme-toggle");
  const icon = document.getElementById("admin-theme-icon");

  const isLight = localStorage.getItem("adminTheme") === "light";

  if (icon) {
    icon.className = isLight
      ? "fa-solid fa-sun w-5 text-orange-400"
      : "fa-solid fa-moon w-5 text-orange-400";
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current =
        localStorage.getItem("adminTheme") === "light" ? "dark" : "light";

      localStorage.setItem("adminTheme", current);

      location.reload();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyAdminTheme();
  initAdminThemeToggle();
});
