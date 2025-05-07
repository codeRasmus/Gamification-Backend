async function csvToJson(req, res, next) {
  try {
    console.log("csvToJson middleware activated");
    console.log("req.body:", req.body); // Debugging log

    const csvText = req.body.toString(); // This assumes the body is a string
    const lines = csvText.trim().split("\n");

    if (lines.length < 2) {
      return res.status(400).json({ message: "CSV data is too short" });
    }

    const regex = /(".*?"|[^",\n]+)(?=\s*,|\s*$)/g;
    const headers = [];
    const data = [];

    const headerLine = lines[0];
    let match;
    while ((match = regex.exec(headerLine)) !== null) {
      headers.push(match[0].replace(/(^"|"$)/g, "").trim());
    }

    lines.slice(1).forEach((line) => {
      const values = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        values.push(match[0].replace(/(^"|"$)/g, "").trim());
      }
      const entry = {};
      headers.forEach((header, i) => {
        entry[header] = values[i] || "";
      });
      data.push(entry);
    });

    console.log("Parsed CSV data:", data); // Debugging log
    req.jsonData = data;
    next();
  } catch (err) {
    console.error("Error parsing CSV to JSON:", err);
    res.status(500).json({ message: "Fejl i parsing af CSV til JSON" });
  }
}

module.exports = csvToJson;
