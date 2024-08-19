import EventEmitter from "node:events";
import { getLocation } from "./functions.js";

export class EventHandler extends EventEmitter {
	constructor(client) {
		super();
		this.client = client;
	}

	async onEvent(event) {
		try {
			if (event.event === "thread.run.requires_action") {
				await this.handleRequiresAction(
					event.data,
					event.data.id,
					event.data.thread_id,
				);
			} else if (event.event === "thread.message.completed") {
				// await this.getMessage(event.data.thread_id, event.data.id);
			} else if (event.event === "thread.run.failed") {
				console.log(event);
			} else if (event.event === "thread.run.completed") {
				
			}
		} catch (error) {
			console.error("Error handling event:", error);
		}
	}

	async getMessage(threadId, messageId) {
		const message = await this.client.beta.threads.messages.retrieve(
			threadId,
			messageId,
		);
	}

	async handleRequiresAction(data, runId, threadId) {
		try {
			const toolOutputs = [];
			const tools = data.required_action.submit_tool_outputs.tool_calls;
			for (const tool of tools) {
				if (tool.function.name === "getLocation") {
					const response = await getLocation();
					toolOutputs.push({
						tool_call_id: tool.id,
						output: response,
					});
				}
			}
			await this.submitToolOutputs(toolOutputs, runId, threadId);
		} catch (error) {
			console.error("Error processing required action:", error);
		}
	}

	async submitToolOutputs(toolOutputs, runId, threadId) {
		try {
			const stream = this.client.beta.threads.runs.submitToolOutputsStream(
				threadId,
				runId,
				{ tool_outputs: toolOutputs },
			);
			for await (const event of stream) {
				this.emit("event", event);
			}
		} catch (error) {
			console.error("Error submitting tool outputs:", error);
		}
	}
}
