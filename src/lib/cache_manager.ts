import NodeCache from "node-cache";

const InMemoryCache = new NodeCache({
  stdTTL: 300,
});

export default InMemoryCache;
