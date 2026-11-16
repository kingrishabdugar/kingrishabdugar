// Updates the DEV.to follower badge in README.md between the marker comments.
const fs = require("fs");

const KEY = process.env.DEVTO_API_KEY;
const README = "README.md";
const START = "<!-- DEVTO-FOLLOWERS:START -->";
const END = "<!-- DEVTO-FOLLOWERS:END -->";

if (!KEY) throw new Error("DEVTO_API_KEY secret is missing.");

async function countFollowers() {
  const perPage = 1000;
  let total = 0;
  for (let page = 1; ; page++) {
    const res = await fetch(
      `https://dev.to/api/followers/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          "api-key": KEY,
          Accept: "application/vnd.forem.api-v1+json",
          "User-Agent": "kingrishabdugar-readme",
        },
      }
    );
    if (!res.ok) throw new Error(`DEV.to API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const batch = await res.json();
    if (!Array.isArray(batch)) throw new Error("Unexpected DEV.to response.");
    total += batch.length;
    if (batch.length < perPage) return total;
  }
}

function pretty(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : String(n);
}

(async () => {
  const n = await countFollowers();
  if (n === 0) throw new Error("Got 0 followers; leaving README unchanged.");
  const badge =
    `<a href="https://dev.to/rishabdugar"><img src="https://img.shields.io/badge/dev.to-` +
    `${encodeURIComponent(pretty(n) + " followers")}-0A0A0A?style=flat-square&logo=devdotto&logoColor=white" ` +
    `alt="dev.to, ${n} followers"/></a>`;
  const text = fs.readFileSync(README, "utf8");
  const re = new RegExp(`${START}[\\s\\S]*?${END}`);
  if (!re.test(text)) throw new Error("Markers not found in README.md.");
  fs.writeFileSync(README, text.replace(re, `${START}${badge}${END}`));
  console.log("DEV.to followers:", n);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
