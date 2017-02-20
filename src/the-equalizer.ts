import * as DiscordJS from "discord.js";

import * as VoteSystem from "./vote";

import * as IsOnline from "is-online";

const Options = require("../options.json");

const client: DiscordJS.Client = new DiscordJS.Client();

let currentPoll: VoteSystem.Poll = null;

async function loginWaiter()
{
	console.log("Waiting for a connection to Discord before logging in...");
	for (let firstTry = true; ; firstTry = false)
	{
		let result = await IsOnline
		(
			{
				timeout: 5000,
				hostnames:
				[
					"https://discordapp.com"
				]
			}
		);

		if (result)
		{
			client.login(Options.auth);
			console.log("Connected!");
			break;
		}

		else if (!firstTry)
		{
			console.log("Couldn't connect... trying again!");
		}
	}
}

client.on
(
	"ready",
	
	() =>
	{
		console.log("Ready!");
	}
);

client.on
(
	"voiceStateUpdate",
	
	() =>
	{
		if (currentPoll !== null)
		{
			currentPoll.check();
			if (currentPoll.concluded)
				currentPoll = null;
		}
	}
);

client.on
(
	"message",

	(message: DiscordJS.Message) =>
	{
		if (message.content.substring(0,1) === '=')
		{
			let command: Array<string> = message.content.split(' ');
			command[0] = command[0].substring(1);

			switch(command[0])
			{
				case "ping":
					message.reply("Pong!");
					break;

				case "destroy":
					if (message.author.id === Options.ownerID)
					{
						console.log("Shutting down...");
						client.destroy();
						process.exit();
					}
					
					break;

				case "source":
					if (command.length > 1)
						message.reply("If you were looking for my source code, you can find it here:");
					else
						message.reply("My source code is located here:");
					
					message.channel.sendMessage("`https://github.com/ZLima12/TheEqualizer`");

					break;

				case "vote":
					if (currentPoll === null || !currentPoll.underway())
					{
						message.reply("There is currently no vote being run.");
					}

					else
					{
						currentPoll.vote(message);

						if (currentPoll.concluded)
							currentPoll = null;
					}

					break;

				case "mute":
					if (currentPoll === null)
					{
						currentPoll = VoteSystem.Poll.standardPoll(message, "mute", (member: DiscordJS.GuildMember) => member.setMute(true), (2 / 3));
						if (currentPoll !== null)
							currentPoll.start();
					}

					else
						message.reply("There is already a poll underway.");

					break;

				case "unmute":
					if (currentPoll === null)
					{
						currentPoll = VoteSystem.Poll.standardPoll(message, "unmute", (member: DiscordJS.GuildMember) => member.setMute(false), (2 / 3));

						if (currentPoll !== null)
							currentPoll.start();
					}

					else
						message.reply("There is already a poll underway.");

					break;

				case "cancel":
					if (currentPoll === null || !currentPoll.underway())
					{
						message.reply("There is currently no poll being run.");
						break;
					}

					if (message.author.id === currentPoll.uid || (message.member.hasPermission("ADMINISTRATOR") && command[1] === "--force"))
					{
						currentPoll.sendMessage("The vote to " + currentPoll.desc + " has been canceled.");
						currentPoll = null;
						break;
					}

					message.reply("No can do. Only " + currentPoll.message.author.username + " can cancel the current vote.");

					break;

				default:
					message.reply("What does `" + command[0] + "` mean?");
			}
		}
	}
);

loginWaiter();