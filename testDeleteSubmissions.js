const http = require("http");

const options = {
  hostname: "localhost",
  port: 5500, // Ensure this matches the port you're using for the server
  path: "/api/submission", // The path to your route for deleting submissions
  method: "DELETE",
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
      console.log("Response:", json);
    } catch (e) {
      console.error("Failed to parse JSON:", e.message);
      console.log(data);
    }
  });
});

req.on("error", (error) => {
  console.error("Request error:", error.message);
});

req.end();
