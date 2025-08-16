"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const google_genai_1 = require("@langchain/google-genai");
const langgraph_1 = require("@langchain/langgraph");
// Define the channels
const graphState = {
    messages: {
        value: (x, y) => x.concat(y),
        default: () => [],
    },
};
// Create the model
const model = new google_genai_1.ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
});
// Define the agents
async function investigator(state) {
    return {
        messages: [
            {
                role: "assistant",
                content: "I found relevant information about renewable energy.",
            },
        ],
    };
}
async function redactor(state) {
    const context = state.messages.map((m) => m.content).join("\n");
    const response = await model.invoke(state.messages);
    return { messages: [response] };
}
// Create the state graph connecting the agents
const workflow = new langgraph_1.StateGraph({ channels: graphState })
    .addNode("investigator", investigator)
    .addNode("redactor", redactor)
    .addEdge("investigator", "redactor") // flow A → B
    .addEdge("redactor", langgraph_1.END); // ends after the redactor
workflow.setEntryPoint("investigator");
// Compile the graph
exports.app = workflow.compile();
// Execute the flow
(async () => {
    const result = (await exports.app.invoke({ messages: [{ role: "user", content: "I need information about renewable energy." }] }));
    console.log("Final result:\n", result.messages[result.messages.length - 1].content);
})();
