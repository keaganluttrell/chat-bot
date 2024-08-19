import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import OpenAI from "openai";
import Showdown from "showdown";
import { EventHandler } from "./utilities/classes.js";

if (process.env.NODE_ENV !== "production") {
	dotenv.config();
}

const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });

const AST = process.env.ASSISTANT;

const app = express();
const port = 3000;
const converter = new Showdown.Converter();

app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static
app.use(express.static("public"));

app.get("/healthcheck", (i, o) => {
	o.status(200).send("ok");
});

app.post("/test", (i, o) => {
	console.log(i.body);
	o.status(200).send(`<p>Test Success!</p>`);
});

app.post("/ai", async (i, o) => {
	try {
		const { question } = i.body;
		const eventHandler = new EventHandler(openai);
		eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));

		const thread = await openai.beta.threads.create();

		await openai.beta.threads.messages.create(thread.id, {
			role: "user",
			content: question,
		});

		const stream = await openai.beta.threads.runs.stream(
			thread.id,
			{ assistant_id: AST },
			eventHandler,
		);

		const messages = [];

		for await (const event of stream) {
			eventHandler.emit("event", event);
			if (event.event === "thread.message.completed") {
				// console.log("event", "thread.message.completed");
				const message = await openai.beta.threads.messages.retrieve(
					thread.id,
					event.data.id,
				);
				messages.push(converter.makeHtml(message.content[0].text.value));
			}
		}

		const output = messages.join("");

		o.status(200).set("Content-Type", "text/html").send(output);
	} catch (error) {
		console.error(error);
		o.status(400)
			.set("Content-Type", "text/html")
			.send("Bad Request");
	}
});

app.listen(port, () => {
	console.log(`server listening on port ${port}`);
});
