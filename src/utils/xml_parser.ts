import { XMLParser } from "fast-xml-parser";

const parseXMLFile = async (data: string | Buffer) => {
  const parser = new XMLParser();
  const result = parser.parse(data);
  return result;
};

export { parseXMLFile };
