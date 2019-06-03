const fs = require("fs");

function main() {
  const data = JSON.parse(fs.readFileSync("./2019.json", { encoding: "utf8" }));

  const stages = data.data.stages;

  fs.writeFileSync("./src/stages-2019.json", JSON.stringify(stages));
}

if (require.main === module) {
  main();
}
