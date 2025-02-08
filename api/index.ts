const express = require("express");
const app = express();
import { parseCoordinates } from "./helpers/parseCoordinates";

function escapeXml(str: any): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}


app.get("/", (req, res) => res.send("Express on Vercel"));

app.get("/api/locations", async (req, res) => {
    const response = await fetch(process.env.SHEET_TSV_URL);
    const data = await response.text();
    const rows = data.split('\n');
    const headers = rows[1].split('\t');

    const filterValidItems = (rows, headers) =>
        rows.slice(2)
            .map(row => {
                const values = row.split('\t');
                return values[1] === 'знайдено'
                    ? headers.reduce((acc, header, index) => {
                        acc[header] = values[index];
                        return acc;
                    }, {})
                    : null;
            })
            .filter(item => item !== null);

    const groupBySubdivision = (items) =>
        items.reduce((acc, item) => {
            const key = item['підрозділ'];
            acc[key] = acc[key] || [];
            acc[key].push(item);
            return acc;
        }, {});

    const generateKML = (groupedData) =>
        Object.entries(groupedData).map(([key, items]) => {
            const placemarks = items.map(({ 'Координати': coordinates, 'Лінк відео': videoLink }) => {
                const [lng, lat] = parseCoordinates(coordinates);
                return `<Placemark>
                    <description>
                        <a href="${videoLink}">${videoLink}</a>
                    </description>
                    <Point>
                        <coordinates>${lng},${lat}</coordinates>
                    </Point>
                </Placemark>`;
            }).join('\n');

            return `<Folder>
                <name>${escapeXml(key)}</name>
                ${placemarks}
            </Folder>`;
        });

    const items = filterValidItems(rows, headers);
    const grouped = groupBySubdivision(items);
    const result = generateKML(grouped);


    const kml = `<?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
            ${result.join('\n')}
        </Document>
    </kml>`;

    res.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
    res.setHeader("Content-Disposition", 'attachment; filename="map.kml"');
    res.send(kml);
});

app.listen(3001, () => console.log("Server ready on port 3001."));

module.exports = app;
