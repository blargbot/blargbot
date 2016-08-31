var e = module.exports = {}
var bu = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}

e.requireCtx = require

e.isCommand = true;
e.hidden = false
e.usage = 'settings [help|set <key>]';
e.info = 'Gets or sets the settings for the current guild.';
e.category = bu.CommandType.ADMIN;

e.execute = (msg, words, text) => {
    if (!bu.config.discord.servers[msg.channel.guild.id])
        bu.config.discord.servers[msg.channel.guild.id] = {}
    if (words.length == 1) {
        //do settings shit
        var prefix = bu.config.discord.servers[msg.channel.guild.id].prefix
            ? bu.config.discord.servers[msg.channel.guild.id].prefix : '!'
        var nsfwMessage = 'None set'
        if (bu.config.discord.servers[msg.channel.guild.id].nsfw) {
            nsfwMessage = '\n - '
            var chanarray = Object.keys(bu.config.discord.servers[msg.channel.guild.id].nsfw)
            for (var i = 0; i < chanarray.length; i++) {
                if (bu.config.discord.servers[msg.channel.guild.id].nsfw[chanarray[i]]) {
                    nsfwMessage += bot.getChannel(chanarray[i]).name + '\n - '
                }
            }
            nsfwMessage = nsfwMessage.substring(0, nsfwMessage.length - 4)

        } 
        //    ? '\n - ' + Object.keys(bu.config.discord.servers[msg.channel.guild.id].nsfw).join('\n - ')
       //     : 'None'
        var greeting = bu.config.discord.servers[msg.channel.guild.id].greeting
            ? bu.config.discord.servers[msg.channel.guild.id].greeting : 'Not set'
        var farewell = bu.config.discord.servers[msg.channel.guild.id].farewell
            ? bu.config.discord.servers[msg.channel.guild.id].farewell : 'Not set'
        var modlogChannel = bu.config.discord.servers[msg.channel.guild.id].modlog
            ? bot.getChannel(bu.config.discord.servers[msg.channel.guild.id].modlog).name : 'Not set'
        var commandCount = bu.config.discord.servers[msg.channel.guild.id].commands
            ? Object.keys(bu.config.discord.servers[msg.channel.guild.id].commands).length : 0
        var deleteNotif = bu.config.discord.servers[msg.channel.guild.id].deleteNotifications ? true : false
        var message = `\`\`\`fix
Settings for ${msg.channel.guild.name}
Prefix          : ${prefix}
NSFW Channels   : ${nsfwMessage}
Greeting        : ${greeting}
Farewell        : ${farewell}
Modlog Channel  : ${modlogChannel}
Custom Commands : ${commandCount}
Track Deletes   : ${deleteNotif}
\`\`\``
        bu.sendMessageToDiscord(msg.channel.id, message)

    } else {
        words.shift()
        switch (words.shift().toLowerCase()) {
            case 'set':
                if (words.length > 0) {
                    var message = ':ok_hand:'
                    switch (words.shift().toLowerCase()) {
                        case 'deletenotification':
                            if (bu.config.discord.servers[msg.channel.guild.id].deleteNotifications == true) {
                                bu.config.discord.servers[msg.channel.guild.id].deleteNotifications = false
                            } else {
                                bu.config.discord.servers[msg.channel.guild.id].deleteNotifications = true
                            }

                            break;
                        case 'greeting':
                            if (words.length == 0) {
                                delete bu.config.discord.servers[msg.channel.guild.id].greeting
                            } else {
                                bu.config.discord.servers[msg.channel.guild.id].greeting = words.join(' ')
                            }
                            break;
                        case 'greeting':
                            if (words.length== 0) {
                                delete bu.config.discord.servers[msg.channel.guild.id].farewell
                            } else {
                                bu.config.discord.servers[msg.channel.guild.id].farewell = words.join(' ')
                            }
                            break;
                        case 'prefix':
                            if (words.length == 0) {
                                delete bu.config.discord.servers[msg.channel.guild.id].prefix
                            } else {
                                bu.config.discord.servers[msg.channel.guild.id].prefix = words.join(' ')
                            }
                            break;
                        default:
                        message = 'Unknown key!'
                            break;
                    }
                    bu.sendMessageToDiscord(msg.channel.id, message)
                    bu.saveConfig()
                }
                break;
            case 'help':
                bu.sendMessageToDiscord(msg.channel.id, `\`\`\`fix
You can use \`settings set <key> [value]\` to set the following settings:
  deleteNotification - if enabled, notifies you if a user deleted their command
  greeting - what to say to new users when they join. You can also use the \`greet\` command
  farewell - what to say when a user leaves. You can also use the \`farewell\` command
  prefix - the custom command prefix. You can also use the \`setprefix\` command
\`\`\``)
                break;
        }
    }
}