const { readFile } = require("fs");

let count = 0;

const sendTestingRequest = async () => {
  count += 1;
  console.log(`request data - ${count}`);
  readFile("./data.xml", "utf-8", async (error, data) => {
    if (error) {
      console.log("error");
      console.log(error);
      return;
    }

    await fetch("http://localhost:3000/parse-xml", {
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

sendTestingRequest();
// setInterval(sendTestingRequest, 100);
