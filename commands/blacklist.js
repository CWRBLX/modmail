const { MessageEmbed, MessageAttachment } = require("discord.js");
const { blacklistUser, unblacklistUser } = require("../utils");

module.exports = {
    name: "blacklist",
    aliases: ["block", "bl", "unblacklist", "unblock", "unbl"],
    usage: "blacklist <add/remove> <user> [reason]",
    description: "Blacklist a user from using the bot",
    async execute(client, message, args) {
        try {
            let user;
            if (!args[0]) return message.reply({ content: client.error("Please provide a type (add/remove)") })
            if (!["add", "remove"].includes(args[0].toLowerCase())) return message.reply({ content: client.error("Please provide a valid type (add/remove)") })
            const type = args[0].toLowerCase()
            args.shift()
            if (!args[0]) return message.reply({ content: client.error("Please provide a user to blacklist") })
            if (args[0].startsWith("<@") && args[0].endsWith(">")) {
                args[0] = args[0].slice(2, -1);
                if (args[0].startsWith("!")) {
                    args[0] = args[0].slice(1);
                }
            }
            user = await client.users.fetch(args[0]).catch(() => { })
            if (!user) return message.reply({ content: client.error("Please provide a valid user to blacklist") })
            args.shift()
            const reason = args[0] ? args.join(" ") : "No reason provided"

            const isUserBlacklisted = await isBlacklisted({ userId: user.id, db: client.db })
            if (isUserBlacklisted) return message.reply({ content: client.error("That user is already blacklisted") })

            let response;
            if (type === "add") {
                response = await blacklistUser({ userId: user.id, reason, modId: message.author.id, db: client.db })
            } else if (type === "remove") {
                response = await unblacklistUser({ userId: user.id, db: client.db })
            }
            if (response.error) return message.reply({ content: client.error(response.error) })
            
            message.reply({ content: client.success(`Successfully ${type === "add" ? "blacklisted" : "unblacklisted"} **${user.tag}**.`) })
        } catch (err) {
            console.log(err)
            await message.reply({ content: client.error(`Error: ${err}`) })
        }
    }
}