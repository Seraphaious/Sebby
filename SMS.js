// Get the user ID at the start of the conversation
const userId = "12345"; // Replace with actual user ID

// Generate a unique ID for each vector using the user ID and timestamp
const generateId = (userId) => {
  const timestamp = new Date().toISOString();
  return `${userId}_${timestamp}`;
};

// Define the lines of text to embed
const linesBatch = ["Sample document text goes here", "there will be several phrases in each batch"];

// Create embeddings
const res = await openai.embeddings.create({
  engine: 'text-embedding-ada-002',
  input: linesBatch,
});

// Extract embeddings to a list
const embeds = res.data.map((record) => record.embedding);

// Prep metadata and upsert
const metadata = linesBatch.map((text) => ({ message: text }));
const toUpsert = embeds.map((embedding, i) => ({
  vector: embedding,
  id: generateId(userId),
  metadata: { ...metadata[i], userId },
}));

await index.upsert({ items: toUpsert });
