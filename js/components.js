/* ============================================================
   components.js  —  Reusable pieces of UI
   ------------------------------------------------------------
   Each function takes data in and returns an HTML string.
   That is what "reusable component" means without a framework:
   one function, one piece of interface, called anywhere.
   ============================================================ */

/* ---------- Room card ---------- */
function RoomCard(room) {
  return `
    <article class="room-card">
      <div class="room-art art-${room.art}" data-label="${escapeHtml(room.name)}">
        <div class="grid-lines"></div>
      </div>
      <div class="room-body">
        <div class="room-top">
          <h3>${escapeHtml(room.name)}</h3>
          <span class="room-price">RM${room.pricePerHour}<span>/hr</span></span>
        </div>

        <div class="room-meta">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="8" cy="5" r="2.6"/><path d="M2.5 14c0-3 2.5-4.6 5.5-4.6s5.5 1.6 5.5 4.6"/>
          </svg>
          Up to ${room.capacity} people
        </div>

        <p>${escapeHtml(room.description)}</p>

        <ul class="chips">
          ${room.facilities.map((f) => `<li class="chip">${escapeHtml(f)}</li>`).join("")}
        </ul>

        <button class="btn btn-primary btn-block" data-book="${room.id}">
          Book now
        </button>
      </div>
    </article>`;
}

/* ---------- Timeline strip ----------
   The signature piece. One button per opening hour.
   States: free / chosen / edge (start & end) / taken.
------------------------------------------------------------ */
function Timeline(bookedHours, startHour, endHour) {
  let slots = "";

  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    const taken = bookedHours.includes(h);
    const inRange =
      startHour !== null && endHour !== null && h >= startHour && h < endHour;
    const isEdge =
      (startHour !== null && h === startHour) ||
      (endHour !== null && h === endHour - 1);

    const classes = ["slot"];
    if (taken) classes.push("taken");
    else if (inRange) classes.push(isEdge ? "chosen edge" : "chosen");

    slots += `
      <button type="button"
              class="${classes.join(" ")}"
              data-hour="${h}"
              ${taken ? "disabled aria-disabled='true'" : ""}
              aria-pressed="${inRange ? "true" : "false"}">
        ${pad(h)}
      </button>`;
  }

  return `
    <p class="timeline-hint">Tap your start hour, then your end hour.</p>
    <div class="timeline" id="timeline">${slots}</div>
    <div class="legend">
      <span><i class="swatch free"></i> Available</span>
      <span><i class="swatch sel"></i> Your booking</span>
      <span><i class="swatch busy"></i> Already booked</span>
    </div>`;
}

/* ---------- Live price box ---------- */
function PriceBox(room, hours) {
  const total = hours * room.pricePerHour;
  const calc = hours
    ? `RM${room.pricePerHour} × ${hours} hour${hours > 1 ? "s" : ""}`
    : "Choose your hours above";

  return `
    <div class="price-box">
      <div>
        <div class="price-calc">${calc}</div>
        <div style="font-size:.8rem;color:rgba(255,255,255,.5);margin-top:.15rem">
          ${escapeHtml(room.name)}
        </div>
      </div>
      <div class="price-total">RM${total}</div>
    </div>`;
}

/* ---------- Confirmation receipt ---------- */
function Receipt(b, room) {
  return `
    <div class="confirm-head">
      <div class="confirm-mark">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M5 12.5l4.5 4.5L19 7.5"/>
        </svg>
      </div>
      <h3>Booking confirmed</h3>
      <p>We have held the room for you. Bring your reference to reception.</p>
    </div>

    <div class="receipt">
      <div class="receipt-id">
        <span class="label">Booking reference</span>
        <span class="value">${b.bookingId}</span>
      </div>
      <dl>
        <dt>Room</dt><dd>${escapeHtml(room.name)}</dd>
        <dt>Date</dt><dd class="mono">${formatDate(b.date)}</dd>
        <dt>Time</dt><dd class="mono">${pad(b.startHour)} – ${pad(b.endHour)}</dd>
        <dt>Duration</dt><dd class="mono">${b.hours} hour${b.hours > 1 ? "s" : ""}</dd>
        <dt>People</dt><dd class="mono">${b.people}</dd>
        <dt>Booked by</dt><dd>${escapeHtml(b.name)}</dd>
        <dt>Email</dt><dd>${escapeHtml(b.email)}</dd>
        <dt>Phone</dt><dd class="mono">${escapeHtml(b.phone)}</dd>
        <dt>Purpose</dt><dd>${escapeHtml(b.purpose)}</dd>
        ${b.remarks ? `<dt>Remarks</dt><dd>${escapeHtml(b.remarks)}</dd>` : ""}
        <div class="row-total" style="display:contents">
          <dt>Total</dt><dd>RM${b.total}</dd>
        </div>
      </dl>
    </div>

    <p class="notice">
      Payment is taken at reception. Free cancellation up to 2 hours before your start time.
    </p>`;
}

/* ---------- small helpers ---------- */
function pad(h) {
  return String(h).padStart(2, "0") + ":00";
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-MY", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

// Never inject user text into HTML without escaping it.
// This is a real security habit, not a formality.
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
