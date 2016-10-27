var e = module.exports = {};





e.init = () => {
    
    

    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `guildicon`;
e.args = ``;
e.usage = `{guildicon}`;
e.desc = `Returns the icon of the current guild`;
e.exampleIn = `The guild's icon is {guildicon}`;
e.exampleOut = `The guild's icon is (icon url)`;


e.execute = async function(params) {
    for (let i = 1; i < params.args.length; i++) {
        params.args[i] = await bu.processTagInner(params, i);
    }
    let msg = params.msg;

    var replaceString = `https://cdn.discordapp.com/icons/${msg.channel.guild.id}/${msg.channel.guild.icon}.jpg`;
    var replaceContent = false;


    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};