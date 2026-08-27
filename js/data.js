/* ============================================================
   data.js  —  Room catalogue
   ------------------------------------------------------------
   PHASE 0 (now):  this file IS the database.
   PHASE 4 (AWS):  these same objects become items in a
                   DynamoDB table called "Rooms".
                   Notice each room has an "id" — that becomes
                   the DynamoDB partition key.
   Nothing else in the app reads this file directly.
   Everything goes through api.js. That is deliberate.
   ============================================================ */

const ROOMS = [
  {
    id: "meeting",
    name: "Meeting Room",
    tagline: "For focused discussions",
    description:
      "A quiet room for team catch-ups, client calls, and small reviews.",
    capacity: 6,
    pricePerHour: 40,
    facilities: ["TV screen", "Whiteboard", "Wi-Fi"],
    // Used to draw the room artwork. Swap for real photos later.
    art: "meeting",
  },
  {
    id: "conference",
    name: "Conference Room",
    tagline: "For bigger rooms of people",
    description:
      "Presentation-ready space with a projector for board meetings and pitches.",
    capacity: 12,
    pricePerHour: 50,
    facilities: ["Projector", "TV screen", "Whiteboard", "Wi-Fi"],
    art: "conference",
  },
  {
    id: "private",
    name: "Private Office",
    tagline: "For heads-down work",
    description:
      "A closed office for one to four people who need to concentrate.",
    capacity: 4,
    pricePerHour: 40,
    facilities: ["Desk", "Wi-Fi", "Air conditioning"],
    art: "private",
  },
  {
    id: "training",
    name: "Training Room",
    tagline: "For workshops and classes",
    description:
      "Our largest space, laid out for training sessions and group workshops.",
    capacity: 20,
    pricePerHour: 80,
    facilities: ["Projector", "Tables", "Chairs", "Wi-Fi"],
    art: "training",
  },
];

/* Opening hours. The timeline picker is built from these two numbers. */
const OPEN_HOUR = 8;   // 08:00
const CLOSE_HOUR = 20; // 20:00
