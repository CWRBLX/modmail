const { MessageEmbed, MessageAttachment } = require("discord.js");

module.exports = {
    name: "close",
    aliases: ["delete"],
    description: "Close a ModMail thread",
    async execute(client, message, args) {
        try {
            let ticket;
            if (message?.guild) ticket = await client.db.collection("modmailThread").findOne({ channel: message.channel.id, closed: false })
            else ticket = await client.db.collection("modmailThread").findOne({ user: message.author.id, closed: false })
            if (!ticket) return await message.reply({ content: `:warning: This is not a ModMail thread!` })

            if (client.closing.get(ticket.id)) return await message.reply({ content: `:warning: This thread is already being closed!` })

            client.closing.set(ticket.id, true)

            const messages = await client.db.collection("modmailMessages").find({ id: ticket.id }).toArray()

            const users = [...new Set(messages.map(m => m.author.id))].map(id => id)

            const embed = new MessageEmbed()
                .setTitle("Thread Closed")
                .setDescription(`**Participating users:**\n${users.map(u => `<@${u}>`).join("\n")}`)
                .addField(`Info`, `Opened by <@${ticket.user}>\nOpened <t:${Math.round(ticket.createdAt/1000)}:R>\n\nClosed by <@${message.author.id}>\nClosed <t:${Math.round(Date.now()/1000)}:R>`)
                .setColor("RED")
                .setFooter({ text: `Ticket closed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })

            await client.db.collection("modmailThread").updateOne({ id: ticket.id }, { $set: { closed: true } })

            const attachment = new MessageAttachment(Buffer.from(messages.map(m => `[${new Date(m.createdAt).toLocaleString()}] ${m.author.tag}: ${m.message}`).join("\n")), "transcript.txt")

            const channel = client.channels.cache.get(process.env.LOGS) || await client.channels.fetch(process.env.LOGS)
            await channel.send({ embeds: [embed], files: [attachment] })
        
            const threadChannel = message.channel.id === ticket.channel ? message.channel : client.channels.cache.get(ticket.channel) || await client.channels.fetch(ticket.channel)

            const closingEmbed = new MessageEmbed()
                .setTitle(`Ticket Closed`)
                .setDescription(`Ticket closed by <@${message.author.id}>\nThis channel will be closed in 3 seconds.`)
                .setColor("RED")

            await threadChannel.send({ embeds: [closingEmbed] }).catch(() => null)

            const user = client.users.cache.get(ticket.user) || await client.users.fetch(ticket.user)
            await user.send({ content:`This thread has been closed by <@${message.author.id}>.\n\n**Note:** Sending a message to this DM will open a new thread.`, embeds: [closingEmbed] }).catch(() => null)

            setTimeout(async () => {
                await threadChannel.delete().catch(() => null)
            }, 3000)

        } catch (err) {
            console.log(err)
            await message.reply({ content: client.error(`Error: ${err}`) })
        }
    }
}