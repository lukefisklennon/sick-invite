# Sick Invite (Beta)

Sick Invite is a Discord bot which can secure your private server with controlled, accountable invite links. Normally, a server owner may allow users to create their own invite links, or simply have a single public invite. A problem arises for servers where privacy is important, which is that you have no control over these links once they're shared. Worse, when new users join, you have no idea which invites were used or who shared them.

The traditional solution is to only allow admins to create links, and tell users to ping or DM these admins for an invite. This increases the workload for server staff, and could hamper the growth of your server by creating a barrier for users to invite people.

What Sick Invite does is make it super easy for your users to get an invite link, by simply reacting to the bot's message. You can place this message in any channel, allowing you to control who is allowed to get invites, by restricting access to that channel via roles.

These invite links are shared privately with the user via DM. They're limited to one use, and expire after 48 hours. Users can only get one invite at a time, and are rate-limited to receiving one every 10 minutes.

The bot also sends a welcome message which tags both the new user, and the user who invited them. This way, there is transparency regarding how invites are shared. 

## Warning

The invite link settings, rate-limiting period, channel for welcome messages, and channel mentioned by welcome messages, are currently not configurable. The option to change these settings may be added later.

The bot has not been fully tested and may include bugs. Issues and pull requests are welcome.

## Usage

1. [Invite](https://discord.com/oauth2/authorize?scope=bot&client_id=867388977739857931&permissions=355427) the bot to your server
2. Ping `@Sick Invite` in your channel of choice
3. React to its message to create invites

## Installing

You'll need Node.js and npm before installing the bot.

1. Clone this repo and enter its directory
2. Run `npm install`
3. Run `sudo npm install -g pm2` (optional, only if you want to run it in production)
4. Set the environment variable `SICK_INVITE_TOKEN` to your bot's token

## Running

If you're testing locally, run `npm start`.

If you're in a production environment, use `npm run prod` to start the bot in background. This assumes that [PM2](https://www.npmjs.com/package/pm2) is globally installed. You can then use commands such as `pm2 ls` to manage the bot (see PM2's docs for more info).
