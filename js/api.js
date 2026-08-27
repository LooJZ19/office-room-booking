// /* ============================================================
//    api.js  —  THE MOST IMPORTANT FILE IN THIS PROJECT
//    ------------------------------------------------------------
//    Every piece of data the website needs passes through here.
//    Right now these functions read from data.js and from the
//    browser's own memory.

//    In PHASE 6 you will change ONLY this file. Each function
//    becomes a fetch() call to API Gateway. Nothing else in the
//    app has to change, because nothing else knows where the
//    data comes from.

//    That is what "don't hard-code the architecture" means in
//    practice: one seam, in one file.
//    ============================================================ */

// // PHASE 6: paste your API Gateway URL here, e.g.
// // const API_BASE = "https://abc123.execute-api.ap-southeast-1.amazonaws.com";
// const API_BASE = null; // null = run in local mode

// // Temporary in-browser store. Disappears on refresh — that is fine
// // and it is exactly the problem DynamoDB solves in Phase 4.
// const localBookings = [];

// const API = {
//   /* --------------------------------------------------------
//      Get every room.
//      PHASE 6:  return (await fetch(`${API_BASE}/rooms`)).json();
//      -------------------------------------------------------- */
//   async getRooms() {
//     await fakeNetworkDelay();
//     return ROOMS;
//   },

//   /* --------------------------------------------------------
//      Get one room by id.
//      PHASE 6:  return (await fetch(`${API_BASE}/rooms/${id}`)).json();
//      -------------------------------------------------------- */
//   async getRoom(id) {
//     await fakeNetworkDelay();
//     return ROOMS.find((r) => r.id === id) || null;
//   },

//   /* --------------------------------------------------------
//      Which hours are already taken for this room on this date?
//      Returns an array of hour numbers, e.g. [10, 11, 14]

//      PHASE 4/6: this is the query that makes the timeline strip
//      grey out real bookings from DynamoDB.
//      -------------------------------------------------------- */
//   async getBookedHours(roomId, date) {
//     await fakeNetworkDelay();
//     const taken = [];
//     localBookings
//       .filter((b) => b.roomId === roomId && b.date === date)
//       .forEach((b) => {
//         for (let h = b.startHour; h < b.endHour; h++) taken.push(h);
//       });
//     return taken;
//   },

//   /* --------------------------------------------------------
//      Save a booking.
//      PHASE 6:  POST it to API Gateway -> Lambda -> DynamoDB.

//      Note the shape of the object we send. Keep this shape when
//      you write your Lambda function and the two sides will line
//      up with no translation work.
//      -------------------------------------------------------- */
//   async createBooking(booking) {
//     await fakeNetworkDelay();

//     // The server will own this in Phase 5. For now we fake it.
//     const record = {
//       ...booking,
//       bookingId: generateBookingId(),
//       createdAt: new Date().toISOString(),
//     };
//     localBookings.push(record);
//     return record;
//   },
// };

// /* ---- helpers ---- */

// // A small delay so the loading states are visible while you build.
// // Delete this once real network calls exist.
// function fakeNetworkDelay(ms = 250) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// function generateBookingId() {
//   const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O, they look like 1 and 0
//   let out = "";
//   for (let i = 0; i < 3; i++)
//     out += letters[Math.floor(Math.random() * letters.length)];
//   const digits = Math.floor(1000 + Math.random() * 9000);
//   return `BK-${out}${digits}`;
// }


////////////////////////

/* ============================================================
   api.js  —  now talking to real AWS
   ------------------------------------------------------------
   Phase 0: these functions read from a JavaScript array.
   Phase 6: they call API Gateway -> Lambda -> DynamoDB.

   Every other file in this project is unchanged. That is the
   payoff for keeping one data seam.
   ============================================================ */

const API_BASE = "https://7q9yasln82.execute-api.ap-southeast-2.amazonaws.com";

// Rooms rarely change, so fetch once and keep them in memory.
let roomsCache = null;

const API = {
  async getRooms() {
    if (roomsCache) return roomsCache;

    const res = await fetch(`${API_BASE}/rooms`);
    if (!res.ok) throw new Error("Could not load rooms");

    const rooms = await res.json();

    // DynamoDB uses roomID. The rest of the app expects id.
    // Translate here, at the seam, so nothing else has to care.
    roomsCache = rooms.map((r) => ({ ...r, id: r.roomID }));
    return roomsCache;
  },

  async getRoom(id) {
    const rooms = await this.getRooms();
    return rooms.find((r) => r.id === id) || null;
  },

  async getBookedHours(roomId, date) {
    const url = `${API_BASE}/availability?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(date)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load availability");
    return res.json();
  },

  async createBooking(booking) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });

    const data = await res.json();

    // 409 means someone booked those hours while this form was open.
    // Pass the server's message up so the user sees something real.
    if (!res.ok) throw new Error(data.message || "Could not save booking");

    return data;
  },
};