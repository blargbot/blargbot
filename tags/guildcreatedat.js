var e = module.exports = {};
var bu;
var moment = require('moment');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.TagType.COMPLEX;
};

e.requireCtx = require;

e.isTag = true;
e.name = `guildcreatedat`;
e.args = `(format)`;
e.usage = `{guildcreatedat}`;
e.desc = `Returns the date the current guild was created, in UTC+0. If a <code>format</code> code is specified,
                                the date
                                is
                                formatted accordingly. Leave blank for default formatting. See the <a
                                    href="http://momentjs.com/docs/#/displaying/format/">moment
                                    documentation</a> for more information.
                            `;
e.exampleIn = `This guild was created on {guildcreatedat;YYYY/MM/DD HH:mm:ss}`;
e.exampleOut = `This guild was created on 2016/01/01 01:00:00`;


e.execute = (msg, args, fallback) => {
    var replaceString = '';
    var replaceContent = false;
    var createdDate = msg.channel.guild.createdAt;
    var formatCode = '';
    if (args[2])
        formatCode = args[2];

    replaceString = moment(createdDate).format(formatCode);

    return {
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};