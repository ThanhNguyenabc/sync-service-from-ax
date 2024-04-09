const { readFile } = require("fs");

const TEST_HOST = "http://172.17.97.28:3000";
const LOCAL_HOST = "http://localhost:3000";

const syncCourseInfor = async () => {
  readFile("./data.xml", "utf-8", async (error, data) => {
    if (error) {
      console.log("error");
      console.log(error);
      return;
    }

    await fetch(`${TEST_HOST}/parse-xml`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: data,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      });
  });
};

const syncPlacementTest = async () => {
  readFile("./placement_test.xml", "utf-8", async (error, data) => {
    if (error) {
      console.log("error");
      console.log(error);
      return;
    }

    await fetch(`${LOCAL_HOST}/placement-tests`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: data,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      });
  });
};
syncCourseInfor();
// syncPlacementTest();
