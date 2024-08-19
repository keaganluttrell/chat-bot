import OpenAI from "openai";
import readline from "readline-sync";
import dotenv from "dotenv";
import { EventHandler } from "./utilities/classes.js";

dotenv.config();
const AST = process.env.ASSISTANT;
const apiKey = process.env.OPEN_API_KEY;
const openai = new OpenAI({ apiKey });

async function main() {
	const eventHandler = new EventHandler(openai);
	eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));

	const q = readline.question("User: ");

	const thread = await openai.beta.threads.create();

	await openai.beta.threads.messages.create(thread.id, {
		role: "user",
		content: q || "where am i located?",
	});

	const stream = await openai.beta.threads.runs.stream(
		thread.id,
		{ assistant_id: AST },
		eventHandler,
	);

	for await (const event of stream) {
		eventHandler.emit("event", event);
	}
}

main();
