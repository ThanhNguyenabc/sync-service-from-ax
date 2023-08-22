const { readFileSync, writeFileSync } = require("fs");

const convertToJSON = async () => {
  const jsonData = {};
  let firstLevelKey = "";

  const programData = readFileSync("./programs.cfg", "utf-8").split("\n");
  programData.forEach((line) => {
    const items = line
      .split("=")

      .map((item) => item.replace(/(\r|")/g, "").trim());

    if (items.length == 2) {
      if (items[0] == "name") {
        firstLevelKey = items[1];
        jsonData[firstLevelKey] = {
          [items[0]]: items[1],
        };
      } else {
        jsonData[firstLevelKey] = {
          ...jsonData[firstLevelKey],
          [items[0]]: items[1],
        };
      }
    }
  });

  writeFileSync("./programs.json", JSON.stringify(jsonData), "utf-8");
};

convertToJSON();
