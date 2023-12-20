import { Message } from "kafkajs";
import { Request, Response } from "express";
import KafkaManager, { placement_test_topic } from "@/lib/message_queue/kafka";
import logger from "@/utils/logger";
import { parseXMLFile } from "@/utils/xml_parser";
import addPlacementTest from "@/services/placementTest.service";

const kafka = KafkaManager.getInstance();
const handlePlacementTest = async (message: Message) => {
  const axData = await parseXMLFile(message.value?.toString() || "");
  const placementTest = axData["PlacementTestInformation"];

  if (placementTest) addPlacementTest(placementTest);
};

kafka.consume(placement_test_topic, handlePlacementTest);

const syncPlacementTest = async (req: Request, res: Response) => {
  try {
    const xmlData: string | undefined | null = req.body["data"] || "";
    if (!xmlData || xmlData.length == 0) {
      return res.status(400).json({
        status: 400,
        message: "Data is not valid",
      });
    }

    await kafka.produce(placement_test_topic, [
      { key: "placement_test", value: req.body["data"] || "" },
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
