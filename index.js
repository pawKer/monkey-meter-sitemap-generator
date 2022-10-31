const fs = require("fs");
const path = require("path");
const json = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./aggregate_31-10-2022.json"))
);
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");
const { createGzip } = require("zlib");

const writeSitemapToFile = async (stream, index, inputUrls) => {
  await streamToPromise(Readable.from(inputUrls).pipe(stream)).then((data) => {
    fs.writeFileSync(`sitemap${index}.xml`, data.toString());
    console.log("Wrote to file", index);
  });
};

// Map regNos for each city
const cityMap = new Map();
json.forEach((entry) => {
  if (!cityMap.get(entry.city)) {
    cityMap.set(entry.city, [entry.registrationNo]);
  } else {
    cityMap.get(entry.city).push(entry.registrationNo);
  }
});

let index = 1;
const today = new Date().toISOString().slice(0, 10);

// Create a sitemap for each city with all the regNo URLs
for (let city of Array.from(cityMap.keys())) {
  console.log(city);
  const stream = new SitemapStream({ hostname: "https://monkeymeter.ro" });
  const inputUrls = cityMap.get(city).map((no) => {
    return {
      url: `taxi/${no}`,
      changefreq: "monthly",
      lastmod: today,
    };
  });
  writeSitemapToFile(stream, index, inputUrls);
  index++;
}

// Create a sitemap with the city urls
const cityStream = new SitemapStream({ hostname: "https://monkeymeter.ro" });
const cityUrls = Array.from(cityMap.keys()).map((city) => {
  return {
    url: `city/${city.toLowerCase().replace(" ", "-")}`,
    changefreq: "monthly",
    lastmod: today,
  };
});
writeSitemapToFile(cityStream, 0, cityUrls);
