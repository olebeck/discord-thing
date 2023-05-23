import { REST } from '@discordjs/rest';
import { WebSocketManager } from '@discordjs/ws';
import { GatewayDispatchEvents, GatewayIntentBits, InteractionType, MessageFlags, Client, GatewayOpcodes } from '@discordjs/core';


const token = process.env.DISCORD_TOKEN;
if(!token) {
    console.error("DISCORD_TOKEN not set");
    process.exit(1);
}

// Create REST and WebSocket managers directly
const rest = new REST({ version: '10' }).setToken(token);
//@ts-ignore
rest.requestManager.options.authPrefix = "";

const gateway = new WebSocketManager({
    token,
    intents: GatewayIntentBits.GuildMessages | GatewayIntentBits.MessageContent,
    rest
});

// Create a client to emit relevant events.
const client = new Client({ rest, gateway });

client.on(GatewayDispatchEvents.MessageCreate, async({data: message, api}) => {
    console.log(message.content);
});

client.once(GatewayDispatchEvents.Ready, () => console.log('Ready!'));

// logging
//@ts-ignore
gateway.on("debug", console.log);
//@ts-ignore
gateway.on("dispatch", console.log);


// monkey patch discord.js to identify as a user

//@ts-ignore
const strat: SimpleShardingStrategy = gateway.strategy;
const _spawn = strat.spawn;
strat.spawn = async (ids: number[]) => {
    await _spawn.apply(strat, [ids]);
    for(const shard of strat.shards.values()) {
        const _send = shard.send;
        shard.send = async (data: unknown, important?: boolean) => {
            if(data["op"] == GatewayOpcodes.Identify) {
                const d = data["d"];
                delete d["intents"];
                delete d["shard"];
                d["properties"] = {
                    "os": "Windows",
                    "browser": "Chrome",
                    "device": "",
                    "system_locale": "en",
                    "browser_user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
                    "browser_version": "113.0.0.0",
                    "os_version": "10",
                    "referrer": "",
                    "referring_domain": "",
                    "referrer_current": "",
                    "referring_domain_current": "",
                    "release_channel": "stable",
                    "client_build_number": 199686,
                    "client_event_source": null
                };
                d["client_state"] = {
                    "guild_versions": {},
                    "highest_last_message_id": "0",
                    "read_state_version": 0,
                    "user_guild_settings_version": -1,
                    "user_settings_version": -1,
                    "private_channels_version": "0",
                    "api_code_version": 0
                };
                d["capabilities"] = 8189;
                d["presence"] = {
                    "status": "unknown",
                    "since": 0,
                    "activities": [],
                    "afk": false
                }
            }
            return _send.apply(shard, [data, important]);
        }
    }
}



(async() => {
    await gateway.connect();
})();


