const fields = [
  "site_name",
  "hero_title",
  "hero_description",
  "hero_image",
  "about_name",
  "about_description",
  "about_quote",
  "about_image",
  "donation_link",
];
const form = document.getElementById("settingsForm");
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function updatePreview() {
  const aboutName = getValue("about_name");
  const aboutDescription = getValue("about_description");
  const aboutQuote = getValue("about_quote");
  const aboutImage = getValue("about_image");

  document.getElementById("preview_about_name").textContent = aboutName || "-";

  document.getElementById("preview_about_description").textContent =
    aboutDescription || "-";

  document.getElementById("preview_about_quote").textContent =
    aboutQuote || "-";

  document.getElementById("preview_about_image").src = aboutImage || "";
}

async function loadSettings() {
  try {
    const result = await fetchAPI("/settings");
    const data = result.data;

    if (!data) return;

    fields.forEach((field) => {
      setValue(field, data[field]);
    });

    updatePreview();
  } catch (error) {
    console.error("Load settings error:", error);
    alert("โหลด Settings ไม่สำเร็จ กรุณาตรวจสอบ API");
  }
}

async function saveSettings(e) {
  e.preventDefault();

  const payload = {};

  fields.forEach((field) => {
    payload[field] = getValue(field);
  });

  try {
    const result = await putAPI("/settings", payload);

    if (result.error) {
      alert(`บันทึกไม่สำเร็จ: ${result.error}`);
      return;
    }

    alert("บันทึก Website Settings สำเร็จแล้ว");
    updatePreview();
  } catch (error) {
    console.error("Save settings error:", error);
    alert("เกิดข้อผิดพลาดในการบันทึก Settings");
  }
}

fields.forEach((field) => {
  const el = document.getElementById(field);
  if (el) {
    el.addEventListener("input", updatePreview);
  }
});

form.addEventListener("submit", saveSettings);

document.addEventListener("DOMContentLoaded", loadSettings);
