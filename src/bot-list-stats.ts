import * as HTTP from "http";
import * as HTTPS from "https";
import * as DiscordJS from "discord.js";

export interface DiscordPWStats
{
	server_count: number;
	shard_id?: number;
	shard_count?: number;
}

export class DiscordPWStatsManager
{
	private auth: string;
	private client: DiscordJS.Client;
	private autoPostTimer: NodeJS.Timer;

	public get AutoPosting(): boolean
	{ return this.autoPostTimer !== undefined; }
	public constructor(auth: string, client: DiscordJS.Client)
	{
		this.auth = auth;
		this.client = client;
	}

	public async postStats(): Promise<DiscordPWStats>
	{
		const dataObj: DiscordPWStats = { "server_count": this.client.guilds.size };
		const data: string = JSON.stringify(dataObj);

		const headers: HTTP.OutgoingHttpHeaders =
		{
			"Authorization": this.auth,
			"Content-Type": "application/json",
			"Content-Length": data.length
		};

		const reqOptions: HTTP.RequestOptions =
		{
			host: "bots.discord.pw",
			method: "POST",
			path: "/api/bots/" + this.client.user.id + "/stats",
			headers: headers
		};

		return new Promise<DiscordPWStats>
		(
			(resolve, reject) =>
			{
				const req: HTTP.ClientRequest = HTTPS.request
				(
					reqOptions,

					(res: HTTP.IncomingMessage) =>
					{
						let dataString: string = "";

						res.on
						(
							"data",

							(chunk: string | Buffer) => dataString += (chunk instanceof Buffer) ? chunk.toString() : chunk
						);

						res.on
						(
							"end",

							() =>
							{
								let resObj: object = JSON.parse(dataString);

								if (resObj["error"]) reject(new Error("bots.discord.pw API threw error: " + (resObj["error"] as string)));

								else resolve(resObj as DiscordPWStats);
							}
						)
					}
				);

				req.write(data);
				req.end();
			}
		);
	}

	public postEvery(ms: number): void
	{
		if (this.AutoPosting)
		{
			this.stopAutoPosting();
		}

		this.autoPostTimer = setInterval(() => this.postStats(), ms);
	}

	public stopAutoPosting(): void
	{
		clearInterval(this.autoPostTimer);
		this.autoPostTimer = undefined;
	}
}