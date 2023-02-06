const { MessageEmbed, MessageAttachment } = require("discord.js");

module.exports = {
    name: "closeprompt",
    aliases: ["prompt", "close-prompt"],
    description: "Ask the user if they want to close the thread",
    async execute(client, message, args) {
        if (!message.guild) {
            return await message.reply({ content: `:warning: This command can only be used in a server!` })
        }
        try {
            let ticket;
            if (message?.guild) ticket = await client.db.collection("modmailThread").findOne({ channel: message.channel.id, closed: false })
            else ticket = await client.db.collection("modmailThread").findOne({ user: message.author.id, closed: false })
            if (!ticket) return await message.reply({ content: `:warning: This is not a ModMail thread!` })

            const embed = new MessageEmbed()
                .setTitle(`Thread Answered`)
                .setDescription(`Hey <@${ticket.user}>, your thread has been marked as answered.\n\n\If that is everything, please use **${client.prefix}close**.`)
                .setColor(`GREEN`)

            const user = client.users.cache.get(ticket.user) || await client.users.fetch(ticket.user)
            let sent;
            await user.send({ embeds: [embed] }).then(() => sent = true).catch(() => sent = false)
            if (!sent) return await message.reply({ content: `:warning: I was unable to send a message to the user!` })

            await message.reply({ content: `:white_check_mark: Successfully sent the close prompt to the user!` })
        } catch (err) {
            console.log(err)
            await message.reply({ content: client.error(`Error: ${err}`) })
        }
    }
}