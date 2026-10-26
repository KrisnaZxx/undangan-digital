/* 1. Membuka undangan dan mengontrol musik */
const opening = document.querySelector("#opening");
const invitation = document.querySelector("#invitation");
const music = document.querySelector("#wedding-music");
const musicButton = document.querySelector("#music-toggle");
const musicIcon = document.querySelector("#music-icon");
let toastTimeout;

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3000);
}

function updateMusicButton() {
  const playing = !music.paused;
  musicButton.setAttribute("aria-pressed", String(playing));
  musicButton.setAttribute(
    "aria-label",
    playing ? "Jeda musik" : "Putar musik",
  );
  musicIcon.className =
    "icon bi " + (playing ? "bi-volume-up" : "bi-volume-mute");
}

async function playMusic() {
  try {
    music.volume = 0.3;
    await music.play();
  } catch {
    showToast(
      "Musik belum bisa diputar. Gunakan tombol musik untuk mencoba lagi.",
    );
  }
  updateMusicButton();
}

document.querySelector("#open-invitation").addEventListener("click", () => {
  invitation.inert = false;
  invitation.removeAttribute("aria-hidden");
  document.body.classList.remove("invitation-closed");
  opening.classList.add("is-leaving");
  opening.inert = true;
  window.scrollTo({ top: 0, behavior: "instant" });
  document.querySelector("#beranda").focus({ preventScroll: true });
  opening.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    opening.hidden = true;
  }, 700);
  playMusic();
  loadWishes();
});

musicButton.addEventListener("click", () => {
  if (music.paused) playMusic();
  else music.pause();
});
music.addEventListener("play", updateMusicButton);
music.addEventListener("pause", updateMusicButton);

/* 2. Navigasi dan hitung mundur (waktu acara selalu WIB) */
const header = document.querySelector(".site-header");
window.addEventListener(
  "scroll",
  () => header.classList.toggle("scrolled", window.scrollY > 30),
  { passive: true },
);
document.querySelectorAll("#main-navigation a").forEach((link) => {
  link.addEventListener("click", () => {
    const menu = document.querySelector("#main-navigation");
    if (menu.classList.contains("show"))
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
  });
});

const navigationObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
        const active = link.hash === "#" + entry.target.id;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  },
  { rootMargin: "-15% 0px -60% 0px" },
);
document
  .querySelectorAll("#beranda, #pasangan, #cerita, #acara, #galeri")
  .forEach((section) => navigationObserver.observe(section));

const weddingDate = new Date("2027-01-23T08:00:00+07:00").getTime();
function updateCountdown() {
  const remaining = Math.max(0, Math.floor((weddingDate - Date.now()) / 1000));
  const values = {
    days: Math.floor(remaining / 86400),
    hours: Math.floor(remaining / 3600) % 24,
    minutes: Math.floor(remaining / 60) % 60,
    seconds: remaining % 60,
  };
  for (const [id, value] of Object.entries(values)) {
    document.getElementById(id).textContent = String(value).padStart(2, "0");
  }
  if (remaining === 0) {
    document.querySelector("#countdown-message").textContent =
      "Episode baru kami telah dimulai. Terima kasih untuk setiap doa baikmu.";
    clearInterval(countdownInterval);
  }
}
const countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown();

/* 3. Formulir dan komunikasi API */
async function requestApi(path, data) {
  const response = await fetch(path, {
    ...(data
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      : {}),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || "Permintaan belum berhasil. Silakan coba lagi.",
    );
  return result;
}

function setFeedback(element, message, success) {
  element.textContent = message;
  element.className = "form-feedback " + (success ? "success" : "error");
}

function readableError(error) {
  return ["TypeError", "TimeoutError", "AbortError", "SyntaxError"].includes(
    error.name,
  )
    ? "Koneksi belum tersedia. Periksa internetmu dan coba lagi; isianmu tetap tersimpan di formulir."
    : error.message;
}

const attendance = document.querySelector("#attendance");
function updateGuestField() {
  const attending = attendance.value === "hadir" || attendance.value === "";
  document.querySelector("#guest-count-field").hidden = !attending;
  document.querySelector("#guests").disabled = !attending;
}
attendance.addEventListener("change", updateGuestField);
updateGuestField();

document
  .querySelector("#rsvp-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    const feedback = document.querySelector("#rsvp-feedback");
    const originalLabel = button.innerHTML;
    button.disabled = true;
    button.textContent = "Menyimpan…";
    feedback.textContent = "";
    try {
      const name = form.elements.name.value.trim();
      const result = await requestApi("/api/rsvp", {
        name,
        attendance: attendance.value,
        guests:
          attendance.value === "hadir" ? Number(form.elements.guests.value) : 0,
      });
      setFeedback(feedback, result.message, true);
      if (!document.querySelector("#wish-name").value)
        document.querySelector("#wish-name").value = name;
      form.reset();
      updateGuestField();
    } catch (error) {
      setFeedback(feedback, readableError(error), false);
    } finally {
      button.disabled = false;
      button.innerHTML = originalLabel;
    }
  });

const wishForm = document.querySelector("#wish-form");
const wishInput = document.querySelector("#wish-message");
wishInput.addEventListener("input", () => {
  document.querySelector("#wish-count").textContent = wishInput.value.length;
});
wishForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!wishForm.reportValidity()) return;
  const button = wishForm.querySelector('button[type="submit"]');
  const originalLabel = button.innerHTML;
  const feedback = document.querySelector("#wish-feedback");
  button.disabled = true;
  button.textContent = "Mengirim…";
  feedback.textContent = "";
  try {
    const result = await requestApi("/api/wishes", {
      name: wishForm.elements.name.value.trim(),
      message: wishInput.value.trim(),
    });
    const list = document.querySelector("#wishes-list");
    list.querySelector(".empty-wishes")?.remove();
    list.prepend(createWish(result.wish));
    list.scrollTop = 0;
    setFeedback(feedback, result.message, true);
    wishInput.value = "";
    document.querySelector("#wish-count").textContent = "0";
  } catch (error) {
    setFeedback(feedback, readableError(error), false);
  } finally {
    button.disabled = false;
    button.innerHTML = originalLabel;
  }
});

/* Ucapan dirender sebagai teks, bukan HTML dari pengunjung. */
function createWish(wish) {
  const article = document.createElement("article");
  article.className = "wish";
  const avatar = document.createElement("span");
  avatar.className = "wish-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = [...wish.name][0].toUpperCase();
  const content = document.createElement("div");
  content.className = "wish-content";
  const heading = document.createElement("div");
  heading.className = "wish-heading";
  const name = document.createElement("h3");
  name.textContent = wish.name;
  const time = document.createElement("time");
  const date = new Date(wish.created_at);
  time.dateTime = date.toISOString();
  time.textContent = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
  const message = document.createElement("p");
  message.textContent = wish.message;
  heading.append(name, time);
  content.append(heading, message);
  article.append(avatar, content);
  return article;
}

let nextCursor = null;
let loadingWishes = false;
const loadButton = document.querySelector("#load-wishes");
const retryButton = document.querySelector("#retry-wishes");
async function loadWishes(append = false) {
  if (loadingWishes) return;
  loadingWishes = true;
  const list = document.querySelector("#wishes-list");
  const status = document.querySelector("#wish-list-status");
  list.setAttribute("aria-busy", "true");
  loadButton.disabled = true;
  retryButton.hidden = true;
  status.textContent = "";
  try {
    const result = await requestApi(
      "/api/wishes" + (append && nextCursor ? "?before=" + nextCursor : ""),
    );
    if (!append) list.replaceChildren();
    result.wishes.forEach((wish) => list.append(createWish(wish)));
    if (!list.children.length) {
      const empty = document.createElement("p");
      empty.className = "empty-wishes";
      empty.textContent =
        "Belum ada ucapan. Jadilah yang pertama menitipkan doa baik untuk Naya & Arga.";
      list.append(empty);
    }
    nextCursor = result.nextCursor;
    loadButton.hidden = !nextCursor;
  } catch {
    if (!append && !list.querySelector(".wish")) {
      list.replaceChildren();
      const empty = document.createElement("p");
      empty.className = "empty-wishes";
      empty.textContent =
        "Buku tamu belum dapat dimuat. Kamu bisa mencoba lagi sebentar lagi.";
      list.append(empty);
    }
    status.textContent = "Koneksi buku tamu belum tersedia.";
    retryButton.hidden = false;
  } finally {
    loadingWishes = false;
    list.setAttribute("aria-busy", "false");
    loadButton.disabled = false;
  }
}
loadButton.addEventListener("click", () => loadWishes(true));
retryButton.addEventListener("click", () => loadWishes(Boolean(nextCursor)));

/* 4. Salin rekening */
document.querySelectorAll(".copy-account").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.account);
      showToast("Nomor rekening berhasil disalin.");
    } catch {
      showToast(
        "Belum bisa menyalin otomatis. Silakan salin nomor rekening secara manual.",
      );
    }
  });
});
