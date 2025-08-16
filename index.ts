import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, END, StateGraphArgs } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
import { app } from "./index";

// Define the state interface
interface IState {
  messages: BaseMessage[];
}

// Define the channels
const graphState: StateGraphArgs<IState>["channels"] = {
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
};

// Create the model
const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
});

// Define the agents
async function investigator(state: IState) {
  return {
    messages: [
      {
        role: "assistant",
        content: "I found relevant information about renewable energy.",
      },
    ],
  };
}

async function redactor(state: IState) {
  const context = state.messages.map((m) => m.content).join("\n");
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

// Create the state graph connecting the agents
const workflow = new StateGraph({ channels: graphState })
  .addNode("investigator", investigator)
  .addNode("redactor", redactor)
  .addEdge("investigator", "redactor") // flow A → B
  .addEdge("redactor", END); // ends after the redactor

workflow.setEntryPoint("investigator");

// Compile the graph
export const app = workflow.compile();

// Execute the flow
(async () => {
  const result = (await app.invoke({messages: [{ role: "user", content: "I need information about renewable energy." }]})) as unknown as IState;

  console.log(
    "Final result:\n",
    result.messages[result.messages.length - 1].content
  );
})();