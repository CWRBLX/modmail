const { MessageEmbed } = require("discord.js");
const { logMsg, isBlacklisted } = require("../utils");

module.exports = {
    name: "messageCreate",
    async execute(client, message) {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!client.db) return;

        if (message?.content) {
            if (!message?.content[0].match(/[a-zA-Z0-9]/)) return;
        }

        const thread = await client.db.collection("modmailThread").findOne({ channel: message.channel.id, closed: false });
        const role = message?.member?.roles?.cache?.filter(r => r.hoist).sort((a, b) => b.position - a.position)?.first() || null;

        if (thread) {
            if (!message?.content && !message?.attachments?.size) return await message.react("❌");
            const isUserBlacklisted = await isBlacklisted({ userId: message.author.id, db: client.db })
            if (isUserBlacklisted) return await message.react("❌")

            const user = await client.users.fetch(thread.user);
            await user.send({ 
                content: `**(${role ? role.name : "Staff Member"}) ${message.member.displayName || message.author.username}:**${message.content ? `\n> ${message.content}` : ``}`,
                embeds: message.embeds,
                files: message?.attachments ? [...message.attachments.values()] : []
            }).catch(() => null);

            await logMsg({
                content: message.content,
                author: message.author,
                color: "GREEN",
                attachments: message?.attachments,
                stickers: message?.stickers,
                db: client.db,
                id: thread.id,
                dontLog: true
            })

            await message.react("✅");
        }
    }
}