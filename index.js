// https://discord.com/oauth2/authorize?scope=bot&client_id=867388977739857931&permissions=355427

// TODO: use linting
// TODO: only delete (concurrentInvites) invites when making the (concurrentInvites + 1)th invite

const fs = require("fs");
const Discord = require("discord.js");

const client = new Discord.Client({
	partials: ["MESSAGE", "CHANNEL", "REACTION"]
});

let inviters = {};
let lastInvited = {};

const file = `${__dirname}/data.json`;
const inviteEmoji = "💌";
const inviteDuration = 60 * 60 * 24 * 2; // 2 days
const inviteDelay = 1000 * 60 * 60; // 1 hour
const concurrentInvites = 1;

const writeFile = () => fs.writeFileSync(file, JSON.stringify(
	{
		inviters,
		lastInvited
	}
));

if (fs.existsSync(file)) {
	(
		{
			inviters,
			lastInvited
		} = JSON.parse(fs.readFileSync(file).toString())
	);
} else {
	writeFile();
}

const addInvite = (invite, user) => {
	inviters[invite.code] = user.id;

	writeFile();
}

const updateInvites = (invites) => {
	let inviter;

	for (let code in inviters) {
		if (!invites.has(code)) {
			inviter = inviters[code];
			delete inviters[code];
		}
	}

	writeFile();

	return inviter;
}

const deleteInvites = async (invites, user) => {
	const deletes = [];

	invites.forEach(async (invite) => {
		if (inviters[invite.code] === user.id) {
			deletes.push(invite.delete());
			delete inviters[invite.code];
		}
	});

	await Promise.all(deletes);

	writeFile();

	return deletes.length > 0;
}

const getLastInvited = (user) => lastInvited[user.id];

const setLastInvited = (user, time) => {
	lastInvited[user.id] = time;
	writeFile();
}

const getIsAdmin = (member) => (
	member && (
		member.guild.ownerID === member
		|| member.hasPermission("ADMINISTRATOR")
	)
);

const checkAdmin = (message) => {
	const ok = getIsAdmin(message.member);

	if (!ok) {
		message.reply("you must have the Administrator permission to run this command");
	}

	return ok;
}

client.on("ready", () => {
	console.log(`Connected as ${client.user.tag}`);
});

client.on("message", async (userMessage) => {
	if (!userMessage.mentions.has(client.user) || !checkAdmin(userMessage)) {
		return;
	}

	userMessage.delete();

	const message = await userMessage.channel.send(`React ${inviteEmoji} to get a private, one-use invite. These expire after 48 hours, and you can invite up to one person per hour.`);

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

	const isAdmin = getIsAdmin(react.message.guild.members.cache.get(user.id));
	const invites = await react.message.guild.fetchInvites();
	updateInvites(invites);

	const alreadyInvited = isAdmin ? false : await deleteInvites(invites, user);

	if (
		!isAdmin && !alreadyInvited
		&& Date.now() - getLastInvited(user) < inviteDelay
	) {
		const wait = Math.ceil(
			(getLastInvited(user) + inviteDelay - Date.now()) / (1000 * 60)
		);

		user.send(`Please wait another ${wait} minute${wait === 1 ? "" : "s"} before requesting another invite`);

		return;
	}

	const invite = await react.message.channel.createInvite({
		maxAge: inviteDuration,
		maxUses: concurrentInvites,
		unique: true,
		reason: `requested by ${user.tag}`
	});

	addInvite(invite, user);
	setLastInvited(user, Date.now());

	await user.send(invite.url);

	if (alreadyInvited) {
		user.send("⚠ Your previous invite has been deleted");
	}
});

client.on("guildMemberAdd", async (member) => {
	const inviterId = updateInvites(await member.guild.fetchInvites());
	const inviter = await client.users.fetch(inviterId);

	let welcomeChannel = member.guild.systemChannel;

	const topChannel = member.guild.channels.cache.filter((channel) => (
		channel.type === "text"
	)).find((channel) => (
		channel.position === 0
	));

	if (!welcomeChannel) welcomeChannel = topChannel;

	welcomeChannel.send(`Welcome ${member.toString()}! You have joined ${member.guild.name}${inviter ? ` by invitation from ${inviter.toString()}` : ""}. Get started by taking a look at ${topChannel.toString()}.`);
});

client.login(process.env.SICK_INVITE_TOKEN);
