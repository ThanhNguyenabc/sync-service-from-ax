import { Kafka } from "kafkajs";
import { Producer, Consumer, Message } from "kafkajs/types/index";
import logger from "@/utils/logger";

const group_id = "handle-xml-consumer-group";

export const kafka_xml_topic = "xml-topic";
export const placement_test_topic = "placement-test";

class KafkaManager {
  private kafka?: Kafka;
  private producer?: Producer;
  public consumer?: Consumer;
  private static instance?: KafkaManager;

  private constructor() {
    this.kafka = new Kafka({
      clientId: "xml-handler-proccessor",
      brokers: ["kafka:9092"],
      connectionTimeout: 3000,
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: group_id });
  }

  static getInstance(): KafkaManager {
    if (!KafkaManager.instance) KafkaManager.instance = new KafkaManager();
    return KafkaManager.instance;
  }

  async produce(topic: string, messages: Message[]) {
    try {
      await this.producer?.connect();
      await this.producer?.send({
        topic,
        messages,
      });
    } catch (error) {
      logger.error(`kafka producer error --> ${error}`);
    } finally {
      await this.producer?.disconnect();
    }
  }

  async consume(topic: string, cb: (value: Message) => void) {
    try {
      await this.consumer?.connect();
      await this.consumer?.subscribe({
        topic,
        fromBeginning: false,
      });
      await this.consumer?.run({
        eachMessage: async ({ topic, partition, message }) => {
          cb(message);
        },
      });
    } catch (error) {
      logger.error(`kafka consumer error --> ${error}`);
    }
  }
}

export default KafkaManager;
