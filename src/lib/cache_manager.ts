import NodeCache from "node-cache";

const InMemoryCache = new NodeCache({
  stdTTL: 600,
});

export default InMemoryCache;
