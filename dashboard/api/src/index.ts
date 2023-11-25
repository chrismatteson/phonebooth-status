import { HandleRequest, HttpRequest, HttpResponse, Kv } from "@fermyon/spin-sdk";

const decoder = new TextDecoder();

export const handleRequest: HandleRequest = async function (request: HttpRequest): Promise<HttpResponse> {
  if (request.method === 'POST') {
    console.log(request.body)
    const { phoneBooth, occupied } = JSON.parse(decoder.decode(request.body));
    console.log(phoneBooth + ": " + occupied)
    // Validate input
    if (!phoneBooth || !occupied) {
      console.log("Invalid request. Missing parameters.")
      return {
        status: 400,
        headers: { "content-type": "text/plain" },
        body: "Invalid request. Missing parameters.",
      };
    }
    if (!["true", "false"].includes(occupied)) {
      console.log("occupied status must be 'true' or 'false'")
      return {
        status: 400,
        headers: { "content-type": "text/plain" },
        body: "occupied status must be 'true' or 'false'",
      };
    }
    // Convert phoneBooth to a number
    const phoneBoothNumber = parseInt(phoneBooth as string, 10);

    // Validate phoneBoothNumber range
    if (isNaN(phoneBoothNumber) || phoneBoothNumber < 1 || phoneBoothNumber > 5) {
      return {
        status: 400,
        headers: { "content-type": "text/plain" },
        body: "Invalid phonebooth number. It should be between 1 and 5.",
      };
    }

    // Convert 'occupied' to a boolean
    const isOccupied = occupied === 'true';

    // Update KV with the current status
    await updateKV(phoneBoothNumber, isOccupied);

    return {
      status: 200,
      headers: { "content-type": "text/plain" },
      body: "Status updated successfully.",
    };
  }

  if (request.method === 'GET') {
    // Retrieve and return the current status of phone booths
    const status = await getPhoneBoothStatus();
    return {
      status: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(status),
    };
  }

  // Handle unsupported methods
  return {
    status: 405,
    headers: { "content-type": "text/plain" },
    body: "Method not allowed.",
  };
};

async function updateKV(phoneBoothNumber: number, isOccupied: boolean): Promise<void> {
  // Update KV with the current status
  let store = Kv.openDefault();
  await store.set(`phonebooth_${phoneBoothNumber}`, JSON.stringify({ occupied: isOccupied }));
}

async function getPhoneBoothStatus() {
  const status: Record<string, boolean> = {};
  let store = Kv.openDefault()

  try {
    // Retrieve the current status of each phone booth
    for (let i = 1; i <= 5; i++) {
      const key = `phonebooth_${i}`;
      const value = await store.get(key);

      // If the key exists in KV, parse the value and add it to the status object
      if (value !== null) {
        const decodedValue = decoder.decode(value);
        const { occupied } = JSON.parse(decodedValue);
        status[key] = occupied;
      } else {
        // If the key doesn't exist, assume it's unoccupied
        status[key] = false;
      }
    }
  } catch (error) {
    console.error('Error getting phone booth status:', error);
  }

  return status;
}
