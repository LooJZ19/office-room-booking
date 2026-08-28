import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

// Table name comes from the template, not hardcoded. The same code
// can then run against a dev table and a prod table unchanged.
const TABLE = process.env.ROOMS_TABLE;

export const handler = async () => {
  try {
    const result = await db.send(new ScanCommand({ TableName: TABLE }));
    const rooms = (result.Items || []).sort(
      (a, b) => a.pricePerHour - b.pricePerHour
    );
    return respond(200, rooms);
  } catch (err) {
    console.error("getRooms failed:", err);
    return respond(500, { message: "Could not load rooms" });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}