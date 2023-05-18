// https://discord.com/oauth2/authorize?scope=bot&client_id=867388977739857931&permissions=355427

// TODO: use linting
// TODO: only delete (concurrentInvites) invites when making the (concurrentInvites + 1)th invite

const fs = require("fs");
const Discord = require("discord.js");

const client = new Discord.Client({
	partials: ["MESSAGE", "CHANNEL", "REACTION"]
});

const getFile = (guildId) => `${__dirname}/data-${guildId}.json`;
const inviteEmoji = "💌";
const inviteDuration = 60 * 60 * 24 * 2; // 2 days
const inviteDelay = 1000 * 60 * 10; // 1 hour
const concurrentInvites = 1;

const writeFile = (guildId, data) => {
	fs.writeFileSync(getFile(guildId), JSON.stringify(data));
}

const readFile = (guildId) => {
	if (fs.existsSync(file)) {
		return JSON.parse(fs.readFileSync(getFile(guildId)).toString());
	} else {
		const data = {
			inviters: [],
			lastInvited: []
		};

		writeFile(guildId, data);
		return data;
	}
}

const addInvite = (guildId, invite, user) => {
	const data = readFile(guildId);
	data.inviters[invite.code] = user.id;
	writeFile(guildId, data);
}

const updateInvites = (guildId, invites) => {
	const data = readFile(guildId);
	let inviter;

	for (let code in data.inviters) {
		if (!invites.has(code)) {
			inviter = data.inviters[code];
			delete data.inviters[code];
		}
	}

	writeFile(guildId, data);

	return inviter;
}

const deleteInvites = async (guildId, invites, user) => {
	const data = readFile(guildId);
	const deletes = [];

	invites.forEach((invite) => {
		if (data.inviters[invite.code] === user.id) {
			deletes.push(invite.delete());
			delete data.inviters[invite.code];
		}
	});

	await Promise.all(deletes);

	writeFile(guildId, data);

	return deletes.length > 0;
}

const getLastInvited = (guildId, user) => (
	readFile(guildId).lastInvited[user.id]
)

const setLastInvited = (guildId, user, time) => {
	const data = readFile(guildId);
	data.lastInvited[user.id] = time;
	writeFile(guildId, data);
}

const getIsAdmin = (member) => (
	member && (
		member.guild.ownerID === member
		|| member.hasPermission("ADMINISTRATOR")
	)
);

const getChannel = (guild, n) => (
	guild.channels.cache.filter((channel) => (
		channel.type === "text"
	)).find((channel) => (
		channel.position === n
	))
);

const getWelcomeChannel = (guild) => (
	guild.systemChannel ? guild.systemChannel : getChannel(guild, 0)
);

client.on("ready", () => {
	console.log(`Connected as ${client.user.tag}`);
});

client.on("message", async (userMessage) => {
	if (!userMessage.mentions.has(client.user) || !getIsAdmin(userMessage.member)) {
		return;
	}

	// userMessage.delete();

	const message = await userMessage.channel.send(`React ${inviteEmoji} to get a one-use invite link. These expire after 48 hours, and you can invite one person at a time, once every ${inviteDelay / (1000 * 60)} minutes.`);

	message.react(inviteEmoji);
});

client.on("messageReactionAdd", async (react, user) => {
	if (react.partial) {
		try {
			await react.fetch();
		} catch (error) {
			console.log(error);
			return;
		}
	}

	if (user.bot || react.message.author.id !== client.user.id) return;

	react.users.remove(user);

	const guildId = guildId;
	const isAdmin = getIsAdmin(react.message.guild.members.cache.get(user.id));
	const invites = await react.message.guild.fetchInvites();
	updateInvites(guildId, invites);

	const alreadyInvited = isAdmin ? false : await deleteInvites(guildId, invites, user);

	if (
		!isAdmin && !alreadyInvited
		&& Date.now() - getLastInvited(guildId, user) < inviteDelay
	) {
		const wait = Math.ceil(
			(getLastInvited(guildId, user) + inviteDelay - Date.now()) / (1000 * 60)
		);

		user.send(`Please wait another ${wait} minute${wait === 1 ? "" : "s"} before requesting another invite`);

		return;
	}

	const invite = await getWelcomeChannel(react.message.guild).createInvite({
		maxAge: inviteDuration,
		maxUses: concurrentInvites,
		unique: true,
		reason: `requested by ${user.tag}`
	});

	addInvite(guildId, invite, user);
	setLastInvited(guildId, user, Date.now());

	await user.send(invite.url);

	if (alreadyInvited) {
		user.send("⚠ Your previous invite has been deleted");
	}
});

client.on("guildMemberAdd", async (member) => {
	const inviterId = updateInvites(member.guild.id, await member.guild.fetchInvites());
	const inviter = await client.users.fetch(inviterId);

	getWelcomeChannel(member.guild).send(`Welcome ${member.toString()}! ${inviter ? `You have joined ${member.guild.name} by invitation from ${inviter.toString()}.` : ""}`);
});

client.login(process.env.SICK_INVITE_TOKEN);
