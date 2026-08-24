/* ============================================================
   main.js  —  Starts the app and wires up page-level events
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  loadRooms();
  wireNav();
  wireModal();
  wireContactForm();
});

/* ---------- render the room cards ---------- */
async function loadRooms() {
  const grid = document.getElementById("roomGrid");
  const footer = document.getElementById("footerRooms");

  try {
    const rooms = await API.getRooms();
    grid.innerHTML = rooms.map(RoomCard).join("");
    footer.innerHTML = rooms
      .map((r) => `<li><a href="#rooms">${escapeHtml(r.name)}</a></li>`)
      .join("");
  } catch (err) {
    console.error(err);
    grid.innerHTML = `
      <p style="grid-column:1/-1">
        Rooms could not be loaded. Refresh the page to try again.
      </p>`;
  }
}

/* ---------- mobile navigation ---------- */
function wireNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* ---------- booking modal triggers ---------- */
function wireModal() {
  // One listener for the whole page. Works for cards that are
  // rendered later, which a listener per button would not.
  document.addEventListener("click", (e) => {
    const bookBtn = e.target.closest("[data-book]");
    if (bookBtn) {
      openBooking(bookBtn.dataset.book);
      return;
    }
    if (e.target.closest("[data-book-any]")) {
      openBooking(null);
    }
  });

  document.getElementById("modalClose").addEventListener("click", closeBooking);

  // Click the dark area outside the panel to close.
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeBooking();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("modal").classList.contains("open")) {
      closeBooking();
    }
  });
}

/* ---------- contact form ---------- */
function wireContactForm() {
  const form = document.getElementById("contactForm");
  const result = document.getElementById("contactResult");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const checks = [
      { el: form.cName, ok: form.cName.value.trim().length > 1 },
      { el: form.cEmail, ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.cEmail.value) },
      { el: form.cMessage, ok: form.cMessage.value.trim().length > 4 },
    ];

    let bad = null;
    checks.forEach((c) => {
      c.el.closest(".field").classList.toggle("invalid", !c.ok);
      if (!c.ok && !bad) bad = c.el;
    });
    if (bad) { bad.focus(); return; }

    // PHASE 5: POST this to a Lambda function that sends email via SES.
    result.style.display = "block";
    result.textContent = "Thanks — we received your message and will reply within one business day.";
    form.reset();
  });
}
