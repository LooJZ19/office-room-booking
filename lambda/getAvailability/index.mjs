import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const TABLE = process.env.BOOKINGS_TABLE;

export const handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const { roomId, date } = params;

    if (!roomId || !date) {
      return respond(400, { message: "roomId and date are required" });
    }

    const result = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "roomDate = :rd",
      ExpressionAttributeValues: { ":rd": `${roomId}#${date}` },
    }));

    const bookedHours = [];
    for (const b of result.Items || []) {
      for (let h = b.startHour; h < b.endHour; h++) bookedHours.push(h);
    }

    return respond(200, bookedHours);
  } catch (err) {
    console.error("getAvailability failed:", err);
    return respond(500, { message: "Could not load availability" });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}