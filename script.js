const $ = (id) => document.getElementById(id);
const STORE = { rsvp: "12a4_rsvp_v1", wishes: "12a4_wishes_v1" };
const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
function toast(message) { const el = $("toast"); el.textContent = message; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2600); }

// Mobile navigation
$("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a => a.addEventListener("click", () => $("mainNav").classList.remove("open")));

// Open / close invitation letter
$("openLetter").addEventListener("click", () => {
  $("openLetter").classList.add("open");
  $("letterContent").classList.add("show");
  $("letterContent").setAttribute("aria-hidden", "false");
  $("tapHint").textContent = "LỜI MỜI DÀNH CHO BẠN";
  setTimeout(() => $("letterContent").scrollIntoView({ behavior: "smooth", block: "nearest" }), 450);
});
$("closeLetter").addEventListener("click", () => {
  $("openLetter").classList.remove("open");
  $("letterContent").classList.remove("show");
  $("letterContent").setAttribute("aria-hidden", "true");
  $("tapHint").textContent = "NHẤN ĐỂ MỞ THƯ";
});

// Countdown: Vietnam local event time (UTC+7)
function updateCountdown() {
  const target = new Date("2026-12-20T09:30:00+07:00").getTime();
  let diff = target - Date.now();
  if (diff <= 0) {
    $("countdown").innerHTML = "<strong>HÔM NAY LÀ NGÀY HẸN CỦA CHÚNG TA ✳</strong>";
    return;
  }
  const days = Math.floor(diff / 86400000); diff %= 86400000;
  const hours = Math.floor(diff / 3600000); diff %= 3600000;
  const minutes = Math.floor(diff / 60000); const seconds = Math.floor((diff % 60000) / 1000);
  $("days").textContent = String(days).padStart(3, "0");
  $("hours").textContent = String(hours).padStart(2, "0");
  $("minutes").textContent = String(minutes).padStart(2, "0");
  $("seconds").textContent = String(seconds).padStart(2, "0");
}
updateCountdown(); setInterval(updateCountdown, 1000);

// RSVP form
$("rsvpForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get("name") || "").trim();
  if (!name) return;
  const entries = read(STORE.rsvp);
  entries.push({
    name, className: String(form.get("class") || "").trim(),
    attendance: String(form.get("attendance") || ""),
    note: String(form.get("note") || "").trim(),
    createdAt: new Date().toLocaleString("vi-VN")
  });
  write(STORE.rsvp, entries);
  $("rsvpFeedback").textContent = "Cảm ơn bạn! Xác nhận đã được lưu trên thiết bị này.";
  event.currentTarget.reset();
  renderAdmin();
});

// Wishes wall
function renderWishes() {
  const saved = read(STORE.wishes);
  const wall = $("wishWall");
  const builtIn = [
    { name: "Một người bạn", text: "Mong rằng sau này, khi nhìn lại, chúng ta vẫn mỉm cười vì đã từng có nhau trong những năm tháng đẹp nhất.", tag: "12A4 · 2026" },
    { name: "12A4", text: "Chúc tất cả chúng ta luôn can đảm, tử tế và rực rỡ trên con đường phía trước.", tag: "ONE LAST MEMORY" }
  ];
  const cards = [...builtIn, ...saved.slice().reverse()];
  wall.innerHTML = cards.map((item, i) => `<article class="wish-card ${i % 3 === 1 ? "wish-card-accent" : ""}"><span>${escapeHTML(item.tag || "A NOTE FOR 12A4")}</span><p>“${escapeHTML(item.text)}”</p><b>— ${escapeHTML(item.name)}</b></article>`).join("");
}
$("wishForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("wishName").value.trim(), text = $("wishText").value.trim();
  if (!name || !text) return;
  const wishes = read(STORE.wishes);
  wishes.push({ name, text, createdAt: new Date().toLocaleString("vi-VN") });
  write(STORE.wishes, wishes);
  event.currentTarget.reset();
  renderWishes(); renderAdmin(); toast("Lời chúc đã được thêm trên thiết bị này ✳");
});

// Local admin panel
function renderAdmin() {
  const rsvps = read(STORE.rsvp), wishes = read(STORE.wishes);
  $("rsvpCount").textContent = rsvps.length;
  $("wishCount").textContent = wishes.length;
  $("rsvpList").innerHTML = rsvps.length ? rsvps.slice().reverse().map(item =>
    `<div class="admin-row"><b>${escapeHTML(item.name)}</b> · ${escapeHTML(item.className || "Chưa ghi lớp")}<br>${escapeHTML(item.attendance)}<br><span>${escapeHTML(item.note || "")}</span><br><small>${escapeHTML(item.createdAt)}</small></div>`
  ).join("") : "Chưa có dữ liệu xác nhận trên thiết bị này.";
}
$("adminToggle").addEventListener("click", () => { $("adminPanel").classList.add("open"); $("adminPanel").setAttribute("aria-hidden", "false"); renderAdmin(); });
$("adminClose").addEventListener("click", () => { $("adminPanel").classList.remove("open"); $("adminPanel").setAttribute("aria-hidden", "true"); });
$("exportData").addEventListener("click", () => {
  const rows = [["Loại", "Họ tên", "Lớp", "Trạng thái", "Lời nhắn", "Thời gian"]];
  read(STORE.rsvp).forEach(x => rows.push(["Xác nhận", x.name, x.className, x.attendance, x.note, x.createdAt]));
  read(STORE.wishes).forEach(x => rows.push(["Lời chúc", x.name, "", "", x.text, x.createdAt]));
  const csv = "\uFEFF" + rows.map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = "du-lieu-ky-yeu-12A4.csv"; a.click(); URL.revokeObjectURL(url);
});
$("clearData").addEventListener("click", () => {
  if (!confirm("Xóa toàn bộ xác nhận và lời chúc đã lưu trên trình duyệt này?")) return;
  localStorage.removeItem(STORE.rsvp); localStorage.removeItem(STORE.wishes);
  renderWishes(); renderAdmin(); toast("Đã xóa dữ liệu trên thiết bị này.");
});
renderWishes(); renderAdmin();
