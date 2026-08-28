import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const TABLE = process.env.BOOKINGS_TABLE;
const OPEN_HOUR = 8;
const CLOSE_HOUR = 20;

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const error = validate(body);
    if (error) return respond(400, { message: error });

    const roomDate = `${body.roomId}#${body.date}`;

    const existing = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "roomDate = :rd",
      ExpressionAttributeValues: { ":rd": roomDate },
    }));

    for (const b of existing.Items || []) {
      if (body.startHour < b.endHour && b.startHour < body.endHour) {
        return respond(409, { message: "Those hours are already booked" });
      }
    }

    const booking = {
      roomDate,
      startHour: body.startHour,
      endHour: body.endHour,
      bookingId: generateBookingId(),
      roomId: body.roomId,
      roomName: body.roomName,
      date: body.date,
      hours: body.endHour - body.startHour,
      people: body.people,
      name: body.name,
      email: body.email,
      phone: body.phone,
      purpose: body.purpose,
      remarks: body.remarks || "",
      total: body.total,
      createdAt: new Date().toISOString(),
    };

    await db.send(new PutCommand({
      TableName: TABLE,
      Item: booking,
      ConditionExpression: "attribute_not_exists(roomDate) AND attribute_not_exists(startHour)",
    }));

    return respond(201, booking);

  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return respond(409, { message: "Those hours were just taken" });
    }
    console.error("createBooking failed:", err);
    return respond(500, { message: "Could not save booking" });
  }
};

function validate(b) {
  if (!b.roomId) return "roomId is required";
  if (!b.date || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return "Valid date is required";
  if (!Number.isInteger(b.startHour) || b.startHour < OPEN_HOUR) return "Invalid start hour";
  if (!Number.isInteger(b.endHour) || b.endHour > CLOSE_HOUR) return "Invalid end hour";
  if (b.endHour <= b.startHour) return "End must be after start";
  if (!b.name || b.name.trim().length < 2) return "Name is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email || "")) return "Valid email is required";
  if (!b.phone || b.phone.replace(/\D/g, "").length < 8) return "Phone is required";
  if (!Number.isInteger(b.people) || b.people < 1) return "Number of people is required";
  if (!b.purpose || b.purpose.trim().length < 3) return "Purpose is required";
  return null;
}

function generateBookingId() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < 3; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return `BK-${out}${Math.floor(1000 + Math.random() * 9000)}`;
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}