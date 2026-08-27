/* ============================================================
   booking.js  —  The booking flow
   ------------------------------------------------------------
   Holds one object, `state`, describing what the user has
   chosen so far. Every click updates state, then re-renders.
   Simple and predictable — no framework needed.
   ============================================================ */

const state = {
  room: null,
  date: todayISO(),
  startHour: null,
  endHour: null,
  bookedHours: [],
};

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalFoot = document.getElementById("modalFoot");
const modalTitle = document.getElementById("modalTitle");
const modalSub = document.getElementById("modalSub");

let lastFocused = null;

/* ---------- open / close ---------- */
async function openBooking(roomId) {
  lastFocused = document.activeElement;

  state.room = roomId ? await API.getRoom(roomId) : (await API.getRooms())[0];
  state.date = todayISO();
  state.startHour = null;
  state.endHour = null;

  await refreshAvailability();

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  await renderBookingForm();
  document.getElementById("modalClose").focus();
}

function closeBooking() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

async function refreshAvailability() {
  state.bookedHours = await API.getBookedHours(state.room.id, state.date);
}

/* ---------- render the form ---------- */
async function renderBookingForm() {
  modalTitle.textContent = "Book " + state.room.name;
  modalSub.textContent = `RM${state.room.pricePerHour}/hour · up to ${state.room.capacity} people`;

  const allRooms = await API.getRooms();
  const roomOptions = allRooms.map(
    (r) =>
      `<option value="${r.id}" ${r.id === state.room.id ? "selected" : ""}>
         ${escapeHtml(r.name)} — RM${r.pricePerHour}/hr
       </option>`
  ).join("");

  modalBody.innerHTML = `
    <form id="bookingForm" novalidate>

      <p class="form-legend">When</p>

      <div class="field-row">
        <div class="field">
          <label for="bRoom">Room type</label>
          <select id="bRoom">${roomOptions}</select>
        </div>
        <div class="field">
          <label for="bDate">Date <span class="req">*</span></label>
          <input type="date" id="bDate" value="${state.date}" min="${todayISO()}" required>
        </div>
      </div>

      <div id="timelineHost">${Timeline(state.bookedHours, state.startHour, state.endHour)}</div>

      <div id="priceHost">${PriceBox(state.room, selectedHours())}</div>

      <p class="form-legend">Who</p>

      <div class="field-row">
        <div class="field">
          <label for="bName">Full name <span class="req">*</span></label>
          <input type="text" id="bName" required autocomplete="name">
          <p class="field-error">Enter your name.</p>
        </div>
        <div class="field">
          <label for="bEmail">Email <span class="req">*</span></label>
          <input type="email" id="bEmail" required autocomplete="email">
          <p class="field-error">Enter a valid email address.</p>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="bPhone">Contact number <span class="req">*</span></label>
          <input type="tel" id="bPhone" placeholder="+60 12-345 6789" required autocomplete="tel">
          <p class="field-error">Enter a contact number.</p>
        </div>
        <div class="field">
          <label for="bPeople">Number of people <span class="req">*</span></label>
          <input type="number" id="bPeople" min="1" max="${state.room.capacity}" value="1" required>
          <p class="field-error">This room seats up to ${state.room.capacity}.</p>
        </div>
      </div>

      <p class="form-legend">What for</p>

      <div class="field">
        <label for="bPurpose">Purpose of booking <span class="req">*</span></label>
        <input type="text" id="bPurpose" placeholder="Client meeting, training session, interviews…" required>
        <p class="field-error">Tell us what the room is for.</p>
      </div>

      <div class="field">
        <label for="bRemarks">Additional remarks</label>
        <textarea id="bRemarks" placeholder="Anything we should set up in advance?"></textarea>
      </div>
    </form>`;

  modalFoot.innerHTML = `
    <span id="footNote" style="font-size:.85rem;color:var(--muted)">
      Select your hours to continue
    </span>
    <button class="btn btn-primary" id="confirmBtn" disabled>Confirm booking</button>`;

  wireForm();
  updatePrice();
}

/* ---------- events inside the form ---------- */
function wireForm() {
  document.getElementById("bRoom").addEventListener("change", async (e) => {
    state.room = await API.getRoom(e.target.value);
    state.startHour = state.endHour = null;
    await refreshAvailability();
    await renderBookingForm();
  });

  document.getElementById("bDate").addEventListener("change", async (e) => {
    state.date = e.target.value;
    state.startHour = state.endHour = null;
    await refreshAvailability();
    redrawTimeline();
    updatePrice();
  });

  document.getElementById("timelineHost").addEventListener("click", (e) => {
    const btn = e.target.closest(".slot");
    if (!btn || btn.disabled) return;
    pickHour(Number(btn.dataset.hour));
  });

  document.getElementById("confirmBtn").addEventListener("click", submitBooking);
}

/* ---------- the click rule for the timeline ----------
   1st click  = start hour (booking is that one hour)
   2nd click later = extend the end
   2nd click earlier or same = start over from there
------------------------------------------------------------ */
function pickHour(h) {
  if (state.startHour === null || h <= state.startHour) {
    state.startHour = h;
    state.endHour = h + 1;
  } else {
    // Don't allow a range that jumps over an already-booked hour.
    for (let i = state.startHour; i <= h; i++) {
      if (state.bookedHours.includes(i)) {
        state.startHour = h;
        state.endHour = h + 1;
        redrawTimeline();
        updatePrice();
        return;
      }
    }
    state.endHour = h + 1;
  }
  redrawTimeline();
  updatePrice();
}

function redrawTimeline() {
  document.getElementById("timelineHost").innerHTML = Timeline(
    state.bookedHours, state.startHour, state.endHour
  );
}

function selectedHours() {
  if (state.startHour === null || state.endHour === null) return 0;
  return state.endHour - state.startHour;
}

function updatePrice() {
  const hours = selectedHours();
  document.getElementById("priceHost").innerHTML = PriceBox(state.room, hours);

  const btn = document.getElementById("confirmBtn");
  const note = document.getElementById("footNote");
  btn.disabled = hours === 0;
  note.textContent = hours
    ? `${pad(state.startHour)} – ${pad(state.endHour)} · ${hours} hour${hours > 1 ? "s" : ""}`
    : "Select your hours to continue";
}

/* ---------- validation + submit ---------- */
function submitBooking() {
  const get = (id) => document.getElementById(id);
  const fields = [
    { el: get("bName"), test: (v) => v.trim().length > 1 },
    { el: get("bEmail"), test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { el: get("bPhone"), test: (v) => v.replace(/\D/g, "").length >= 8 },
    { el: get("bPeople"), test: (v) => +v >= 1 && +v <= state.room.capacity },
    { el: get("bPurpose"), test: (v) => v.trim().length > 2 },
  ];

  let firstBad = null;
  fields.forEach((f) => {
    const ok = f.test(f.el.value);
    f.el.closest(".field").classList.toggle("invalid", !ok);
    if (!ok && !firstBad) firstBad = f.el;
  });

  if (firstBad) {
    firstBad.focus();
    firstBad.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  const hours = selectedHours();
  const booking = {
    roomId: state.room.id,
    roomName: state.room.name,
    date: state.date,
    startHour: state.startHour,
    endHour: state.endHour,
    hours,
    people: +get("bPeople").value,
    name: get("bName").value.trim(),
    email: get("bEmail").value.trim(),
    phone: get("bPhone").value.trim(),
    purpose: get("bPurpose").value.trim(),
    remarks: get("bRemarks").value.trim(),
    total: hours * state.room.pricePerHour,
  };

  saveBooking(booking);
}

async function saveBooking(booking) {
  const btn = document.getElementById("confirmBtn");
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    const saved = await API.createBooking(booking);
    showConfirmation(saved);
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "Confirm booking";
    document.getElementById("footNote").textContent =
      "That did not save. Check your connection and try again.";
  }
}

function showConfirmation(b) {
  modalTitle.textContent = "You're booked";
  modalSub.textContent = b.bookingId;
  modalBody.innerHTML = Receipt(b, state.room);
  modalFoot.innerHTML = `
    <button class="btn btn-ghost" id="printBtn">Print</button>
    <button class="btn btn-primary" id="doneBtn">Done</button>`;

  document.getElementById("printBtn").onclick = () => window.print();
  document.getElementById("doneBtn").onclick = closeBooking;
  modalBody.scrollIntoView({ block: "start" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
