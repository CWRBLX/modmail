const { MessageEmbed, MessageAttachment } = require("discord.js");
const { blacklistUser, unblacklistUser, isBlacklisted } = require("../utils");

module.exports = {
    name: "blacklist",
    aliases: ["block", "bl", "unblacklist", "unblock", "unbl"],
    usage: "blacklist <add/remove> <user> [reason]",
    description: "Blacklist a user from using the bot",
    async execute(client, message, args) {
        if (!message.guild) return message.reply({ content: client.error("This command can only be used in a server.") })
        if (!message.member.permissions.has("MANAGE_GUILD")) return message.reply({ content: client.error("You don't have permission to use this command.") })
        try {
            let user;
            if (!args[0]) return message.reply({ content: client.error("Please provide a type (add/remove)") })
            if (!["add", "remove", "check"].includes(args[0].toLowerCase())) return message.reply({ content: client.error("Please provide a valid type (add/remove)") })
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

            // user checks
            if (!user) return message.reply({ content: client.error("Please provide a valid user to blacklist") })
            if (user.id === message.author.id) return message.reply({ content: client.error("You can't blacklist yourself") })
            if (user.id === client.user.id) return message.reply({ content: client.error("You can't blacklist me") })
            if (user.id === message.guild.ownerId) return message.reply({ content: client.error("You can't blacklist the server owner") })
            if (user.bot) return message.reply({ content: client.error("You can't blacklist a bot") })

            args.shift()
            const reason = args[0] ? args.join(" ") : "No reason provided"
            let response;
            if (type === "add") {
                response = await blacklistUser({ userId: user.id, reason, modId: message.author.id, db: client.db })
            } else if (type === "remove") {
                response = await unblacklistUser({ userId: user.id, db: client.db })
            }
            else if (type === "check") {
                response = await isBlacklisted({ userId: user.id, db: client.db })
                if (response) {
                    const embed = new MessageEmbed()
                        .setTitle(`Blacklist Info`)
                        .setColor("RED")
                        .setDescription(`**User:** ${user.tag} (${user.id})\n**Reason:** ${response.reason}\n**Moderator:** <@${response.moderator}> (${response.moderator})`)
                        .setTimestamp(response?.createdAt || Date.now())
                    return message.reply({ embeds: [embed] })
                }
                else {
                    return message.reply({ content: client.success(`**${user.tag}** is not blacklisted.`) })
                }
            }
            if (response.error) return message.reply({ content: client.error(response.error) })
            
            message.reply({ content: client.success(`Successfully ${type === "add" ? "blacklisted" : "unblacklisted"} **${user.tag}**.`) })
        } catch (err) {
            console.log(err)
            await message.reply({ content: client.error(`Error: ${err}`) })
        }
    }
}