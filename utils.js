const { MessageEmbed } = require("discord.js");

module.exports.logMsg = async (options) => {
    if (!options?.dontLog) {
        const embed = new MessageEmbed()
            .setAuthor(options.author.tag, options.author.displayAvatarURL())
            .setDescription(options.content + (options.attachments.size ? `${options.content ? `\n\n` : ``}${options.attachments.size} attachment${options.attachments.size > 1 ? "s" : ""}` : ``) + (options.stickers.size ? `${options.content || options.attachments.size ? `\n\n` : ``}${options.stickers.size} sticker${options.stickers.size > 1 ? "s" : ""}` : ``))
            .setTimestamp()
            .setColor(options.color)
        options.channel.send({ 
            embeds: [embed],
            files: options?.attachments ? [...options.attachments.values()] : [],
            stickers: options?.stickers ? [...options.stickers.values()] : []
        })
    }
    
    await options.db.collection("modmailMessages").insertOne({
        id: options.id,
        message: options.content,
        attachments: options.attachments.map(a => a.url),
        stickers: options.stickers.map(s => s.url),
        author: {
            id: options.author.id,
            tag: options.author.tag
        },
        createdAt: Date.now()
    })
}