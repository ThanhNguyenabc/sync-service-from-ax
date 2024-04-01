import { Message } from "kafkajs";
import { Request, Response } from "express";
import KafkaManager, { PlacementTestTopic } from "@/lib/message_queue/kafka";
import logger, { logMessage } from "@/utils/logger";
import { parseXMLFile } from "@/utils/xml_parser";
import { addOrUpdatePlacementTest } from "@/services/placementTest.service";

const kafkaManager = KafkaManager.getInstance();

// kafkaManager.consume(
//   PlacementTestTopic,
//   async (topic: string, message: Message) => {
//     try {
//       const axData = await parseXMLFile(message.value?.toString() || "");
//       const placementTest = axData["PlacementTestInformation"];
//       placementTest && addOrUpdatePlacementTest(placementTest);
//     } catch (error) {
//       logger.error(logMessage("error", "placement-test-message", `${error}`));
//     }
//   }
// );

const syncPlacementTest = async (req: Request, res: Response) => {
  try {
    const xmlData: string | undefined | null = req.body["data"] || "";
    if (!xmlData || xmlData.length == 0) {
      return res.status(400).json({
        status: 400,
        message: "Data is not valid",
      });
    }

    await kafkaManager.produce(PlacementTestTopic, [
      { key: "placement_test", value: xmlData },
    ]);
    return res.status(200).json({
      status: 200,
      message: "Received xml-data successfully",
    });
  } catch (error) {
    logger.error(`❌ [route controller] --> ${error}`);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export { syncPlacementTest };
