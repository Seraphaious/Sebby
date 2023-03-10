userMessage is the message the user sends, fairly self explanatory.

//Upsert

const userEmbedding = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: userMessage,
    });
    const userEmbeddingData = userEmbedding.data.data[0].embedding;
    const upsertRequest = {
        vectors: [{
            id: embeddingId,
            values: userEmbeddingData,
            metadata: { message: userMessage}
        }],
        namespace: sessionId,
    };
    const upsertResponse = await index.upsert({
        upsertRequest
    });


//Query

    const queryRequest = {
        vector: userEmbeddingData,
        topK: 1,
        includeValues: true,
        includeMetadata: true,
        namespace: sessionId,
    }

    const queryResult = await index.query({
        queryRequest
    })


console.log(Object.keys(queryResponse[0]));
