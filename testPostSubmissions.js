const http = require("http");

const data = JSON.stringify({
  _id: "681c7c5063093dd47e33b9b2",
  sessionId: "350469",
  teamName: "Sigma",
  answers: [
    {
      taskId: "681c74e2d7f8c88f0da64ef1",
      answer: "Test dummy besvarelse fra testPostSubmissions.js",
    },
  ],
  submittedAt: Date.now(),
});

const options = {
  hostname: "localhost",
  port: 5500,
  path: "/api/submission",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => {
    body += chunk;
  });
  res.on("end", () => {
    console.log("Response:", res.statusCode, body);
  });
});

req.on("error", (error) => {
  console.error("Request error:", error);
});

req.write(data);
req.end();
