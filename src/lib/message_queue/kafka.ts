import { Kafka } from "kafkajs";
import { Producer, Consumer, Message } from "kafkajs/types/index";
import logger from "@/utils/logger";

export const KafkaGroupID = "handle-xml-consumer-group";
export const CourseTopic = "courses";
export const PlacementTestTopic = "placement-tests";

class KafkaManager {
  public kafka: Kafka;
  private producer?: Producer;
  private static instance?: KafkaManager;
  private readonly consumers: Consumer[];
  private constructor() {
    this.kafka = new Kafka({
      clientId: "xml-handler-proccessor",
      brokers: ["kafka:9092"],
      connectionTimeout: 3000,
    });
    this.consumers = [];
    this.producer = this.kafka.producer();
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
      // await this.producer?.disconnect();
    }
  }

  async consume(topic: string, cb: (topic: string, value: Message) => void) {
    const consumer = this.kafka.consumer({
      groupId: `${KafkaGroupID}-${topic}`,
    });

    try {
      await consumer?.connect();
      await consumer?.subscribe({
        topic,
        fromBeginning: false,
      });
      await consumer?.run({
        eachMessage: async ({ topic, partition, message }) => {
          cb(topic, message);
        },
      });
      console.log("----------consumer is connected----------");
      this.consumers.push(consumer);
    } catch (error) {
      logger.error(`kafka consumer error --> ${error}`);
    }
  }
}

export default KafkaManager;
