function csvToJson(csvText) {
  const lines = csvText.trim().split("\n");

  if (lines.length < 2) {
    console.warn("CSV data is too short");
    return [];
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

  return data;
}

module.exports = {
  csvToJson,
};
