const { MessageEmbed } = require("discord.js");

module.exports.logMsg = async (options) => {
    if (!options?.dontLog) {
        const embed = new MessageEmbed()
            .setAuthor(options.author.tag, options.author.displayAvatarURL())
            .setDescription(options.content + (options?.attachments?.size ? `${options.content ? `\n\n` : ``}${options?.attachments?.size || 0} attachment${options?.attachments?.size > 1 ? "s" : ""}` : ``) + (options?.stickers?.size ? `${options.content || options?.attachments?.size ? `\n\n` : ``}${options?.stickers?.size || 0} sticker${options?.stickers?.size  > 1 ? "s" : ""}` : ``))
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
        attachments: options?.attachments?.size ? options.attachments.map(a => a.url) : [],
        stickers: options?.stickers?.size ? options.stickers.map(s => s.url) : [],
        author: {
            id: options.author.id,
            tag: options.author.tag
        },
        createdAt: Date.now()
    })
}

module.exports.isBlacklisted = async (options) => {
    const isBlacklisted = await options.db.collection("modmailBlacklist").findOne({ id: options.userId })
    return isBlacklisted ? isBlacklisted : false
}

module.exports.blacklistUser = async (options) => {
    const isBlacklisted = await options.db.collection("modmailBlacklist").findOne({ id: options.userId })
    if (isBlacklisted) return {
        error: "That user is already blacklisted"
    }
    await options.db.collection("modmailBlacklist").insertOne({
        id: options.userId,
        reason: options.reason,
        moderator: options.modId,
        createdAt: Date.now()
    })
    return {
        error: null
    }
}

module.exports.unblacklistUser = async (options) => {
    const isBlacklisted = await options.db.collection("modmailBlacklist").findOne({ id: options.userId })
    if (!isBlacklisted) return {
        error: "That user isn't blacklisted"
    }
    await options.db.collection("modmailBlacklist").deleteOne({ id: options.userId })
    return {
        error: null
    }
}