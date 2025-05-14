// Ikke en del af programmet, men brugt til at hente samtlige opgavebesvarelser

const http = require("http");

const options = {
  hostname: "localhost",
  port: 5500,
  path: "/api/submission",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      console.log("Submissions:");
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.error("Failed to parse JSON:", e.message);
      console.log(data);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Request error:", error.message);
});

req.end();
