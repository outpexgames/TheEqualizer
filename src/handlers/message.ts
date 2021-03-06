import { Handler } from "../event";
import * as DiscordJS from "discord.js";
import EqualizerClient from "../client";
import { Invocation }  from "../command";

export = new Handler
(
	"message",

	(client: EqualizerClient, message: DiscordJS.Message) =>
	{
		if (!message.author.bot)
		{
			if (message.channel.type !== "text")
			{
				message.reply("Sorry, but I can only be used in servers.");
			}

			const invocation: Invocation = Invocation.fromMessage(message);

			if (invocation)
			{
				client.emit("commandInvoked", invocation);
			}
		}
	}
);
