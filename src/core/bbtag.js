/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:34:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-04 10:36:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const argFactory = require('../structures/ArgumentFactory'),
    af = argFactory,
    bbEngine = require('../structures/bbtag/Engine');

var e = module.exports = {};

e.executeTag = async function (msg, tagName, command) {
    let tag = await r.table('tag').get(tagName).run();
    if (!tag)
        bu.send(msg, `❌ That tag doesn't exist! ❌`);
    else {
        if (tag.deleted === true) {
            await bu.send(msg, `❌ That tag has been permanently deleted by **${bu.getFullName(bot.users.get(tag.deleter))}**

Reason: ${tag.reason}`);
            return;
        }
        r.table('tag').get(tagName).update({
            uses: tag.uses + 1,
            lastuse: r.now()
        }).run();
        let result = await bbEngine.runTag({
            msg,
            tagContent: tag.content,
            flags: tag.flags,
            input: command.map(c => '"' + c + '"').join(' '),
            isCC: false,
            tagName: tagName,
            author: tag.author,
            cooldown: tag.cooldown,
            modResult: function (context, text) {
                return text.replace(/<@!?(\d{17,21})>/g, function (match, id) {
                    let user = msg.guild.members.get(id);
                    if (user == null)
                        return '@' + id;
                    return '@' + user.username + '#' + user.discriminator;
                }).replace(/<@&(\d{17,21})>/g, function (match, id) {
                    let role = msg.guild.roles.get(id);
                    if (role == null)
                        return '@Unknown Role';
                    return '@' + role.name;
                }).replace(/@(everyone|here)/g, (match, type) => '@\u200b' + type);
            }
        });
        /** @type {string} */
        result.code = tag.content;
        return result;
    }
};

e.executeCC = async function (msg, ccName, command) {
    let ccommand = (await bu.getGuild(msg.guild.id)).ccommands[ccName.toLowerCase()];
    if (!ccommand)
        bu.send(msg, `❌ That CCommand doesn't exist! ❌`);
    else {
        let result = await bbEngine.runTag({
            msg,
            tagContent: ccommand.content,
            flags: ccommand.flags,
            input: command.map(c => '"' + c + '"').join(' '),
            isCC: true,
            tagName: ccName,
            author: ccommand.author
        });
        /** @type {string} */
        result.code = ccommand.content;
        return result;
    }
};

e.docs = async function (msg, command, topic) {
    let help = CommandManager.built['help'],
        argsOptions = { separator: { default: ';' } },
        tags = Object.keys(TagManager.list).map(k => TagManager.list[k]),
        words = (topic || 'index').toLowerCase().split(' '),
        prefix = '',
        embed = {
            title: 'BBTag documentation',
            url: 'https://blargbot.xyz/tags',
            color: 0Xefff00//,
            // author: {
            //     name: bot.user.username,
            //     icon_url: bot.user.avatarURL
            // }
        };
    if (msg.channel.guild)
        prefix = await bu.guildSettings.get(msg.channel.guild.id, 'prefix') || config.discord.defaultPrefix;
    if (Array.isArray(prefix)) prefix = prefix[0];

    switch (words[0]) {
        case 'index':
            embed.description = 'Please use `' + prefix + command + ' docs [topic]` to view available information on a topic\nAvailable topics are:';
            embed.fields = Object.keys(bu.TagType.properties)
                .map(k => {
                    return {
                        properties: bu.TagType.properties[k],
                        tags: tags.filter(t => t.category == k)
                    };
                }).filter(c => c.tags.length > 0)
                .map(c => {
                    return {
                        name: c.properties.name + ' subtags - ' + c.properties.desc,
                        value: '```\n' + c.tags.map(t => t.name).join(', ') + '```'
                    };
                }).concat({
                    name: 'Other useful topics',
                    value: '```\nvariables, argTypes, terminology```'
                }).filter(f => f.value.length > 0);
            return await help.sendHelp(msg, { embed }, 'BBTag documentation', true);
        case 'variables':
        case 'variable':
        case 'vars':
        case 'var':
            let tagTypes = bu.tagVariableScopes;
            embed.description = 'In BBTag there are ' + tagTypes.length + ' different scopes that can be used for storing your data. ' +
                'These scopes are determined by the first character of your variable name, so choose carefully!\nThe available scopes are as follows:';
            embed.title += ' - Variables';
            embed.url += '/variables';
            embed.fields = tagTypes.map(t => {
                return {
                    name: t.name + ' variables' + (t.prefix.length > 0 ? ' (prefix: ' + t.prefix + ' )' : ''),
                    value: t.description + '\n\u200B'
                };
            });
            embed.fields.push({
                name: '{commit} and {rollback}',
                value: 'For performance reasons, when a value is `{set}` it wont be immediately populated to the database. ' +
                    '`{commit}` and `{rollback}` can be used to manipulate when variables are sent to the database, if at all. ' +
                    '`{commit}` will force the given variables to be sent to the database immediately. `{rollback}` will ' +
                    'revert the given variables to their original value (start of tag or most recent `{commit}`).\n' +
                    'There is also an additional prefix for {set} and {get} which is `!`. ' +
                    'This prefix can be combined with other prefixes and will act the ' +
                    'same as if you have called `{set}` and then `{commit}` immediately after. e.g. ' +
                    '```{set;!@varname;value}``` is identical to ```{set;@varname;value}{commit;@varname}```'
            });
            return await help.sendHelp(msg, { embed }, 'BBTag documentation', true);
        case 'argtypes':
        case 'arguments':
        case 'parameters':
        case 'params':
            embed.title += ' - Arguments';
            embed.description = 'As you may have noticed, the various help documentation for subtags will have a usage that often look like this: ```\n{subtag;' +
                argFactory.toString([af.require('arg1'), af.optional('arg2'), af.require('arg3', true)], argsOptions) + '}```' +
                'This way of formatting arguments is designed to easily be able to tell you what is and is not required.\n' +
                'All arguments are separated by `;`\'s and each will be displayed in a way that tells you what kind of argument it is.\n' +
                'NOTE: Simple subtags do not accept any arguments and so should not be supplied any.\n' +
                'The basic rules are as follows:\n\u200B';
            embed.fields = [
                {
                    name: 'Required arguments <>',
                    value: 'Example:```\n' + argFactory.toString(af.require('arg'), argsOptions) + '```' +
                        'Required arguments must be supplied for a subtag to work. If they are not then you will normally be given a `Not enough args` error\n\u200B'
                },
                {
                    name: 'Optional arguments []',
                    value: 'Example:```\n' + argFactory.toString(af.optional('arg'), argsOptions) + '```' +
                        'Optional arguments may or may not be provided. If supplied, optional arguments may either change the functionality of the tag ' +
                        '(e.g. `' + prefix + command + ' docs shuffle`) or simply replace a default value (e.g. `' + prefix + command + ' docs username`).\n\u200B'
                },
                {
                    name: 'Multiple arguments ...',
                    value: 'Example:```\n' + argFactory.toString(af.require('arg', true), argsOptions) + '```' +
                        'Some arguments can accept multiple values, meaning you are able to list additional values, still separated by `;`, which will be included in the execution. ' +
                        '(e.g. `' + prefix + command + ' docs randchoose`)\n\u200B'
                },
                {
                    name: 'Nested arguments <<> <>>',
                    value: 'Example:```\n' + argFactory.toString(af.require([af.require('arg1'), af.optional('arg2')], true), argsOptions) + '```' +
                        'Some subtags may have special rules for how their arguments are grouped (e.g. `' + prefix + command + ' docs switch`) ' +
                        'and will use nested arguments to show that grouping. When actually calling the subtag, you provide the arguments as normal, ' +
                        'however you must obey the grouping rules.\n' +
                        'In the example of `switch`, you may optionally supply `<case>` and `<then>` as many times as you like ' +
                        'but they must always be in pairs. e.g. `{switch;value;case1;then1}` or `{switch;value;case1;then1;case2;then2}` etc'
                }
            ];
            return await help.sendHelp(msg, { embed }, 'BBTag documentation', true);
        case 'terms':
        case 'terminology':
        case 'definitions':
        case 'define':
            let terms = {
                BBTag: 'BBTag is a text replacement language. Any text between a `{` and `}` pair (called a subtag) ' +
                    'will be taken as code and run, with the output of that replacing the whole subtag. ' +
                    'Each subtag does something different, and each accepts its own list of arguments.',
                Subtag: 'A subtag is a pre-defined function that accepts some arguments and returns a single output. ' +
                    'Subtags can be called by placing their name between a pair of `{` and `}`, ' +
                    'with any arguments to be passed to the subtag being separated by `;`.\nAs an example:```{math;+;1;2}```' +
                    'Subtag: `math`\nArguments: `+`, `1`, `2`\nResult: `3`',
                Tag: 'A tag is a user-made block of text which may or may not contain subtags. ' +
                    'Any subtags that it does contain will be executed and be replaced by their output.',
                Argument: 'An argument is a single value which gets given to a subtag. Arguments can be numbers, text, arrays, anything you can type really. ' +
                    'Each subtag will require a different argument pattern, so be sure to check what pattern your subtag needs!',
                Variable: 'A variable is a value that is stored in the bots memory ready to access it later on. ' +
                    'For more in-depth details about variables, please use `' + prefix + command + ' docs variable`.',
                Array: 'An array is a collection of values all grouped together, commonly done so by enclosing them inside `[]`. ' +
                    'In BBTag, arrays can be assigned to a variable to store them for later use. In this situation, you might ' +
                    'see an array displayed like this `{"v":["1","2","3"],"n":"varname"}`. If you do, dont worry, nothing is broken! ' +
                    'That is just there to allow ' + bot.user.username + ' to modify the array in place within certain subtags.'
            };
            embed.title += ' - Terminology';

            let term = Object.keys(terms).filter(k => k.toLowerCase() == (words[1] || '').toLowerCase())[0];
            if (term != null) {
                embed.title += ' - ' + term;
                embed.description = terms[term];
                return await help.sendHelp(msg, { embed }, 'BBTag documentation');
            }

            embed.description = 'There are various terms used in BBTag that might not be intuitive, ' +
                'so here is a list of definitions for some of the most important ones:\n\u200B';
            embed.fields = Object.keys(terms).map(k => {
                return {
                    name: k,
                    value: terms[k] + '\n\u200B'
                };
            });
            return await help.sendHelp(msg, { embed }, 'BBTag documentation');
        default:
            topic = topic.replace(/[\{\}]/g, '');
            let tag = TagManager.get(topic.toLowerCase());
            if (tag == null)
                break;
            let category = bu.TagType.properties[tag.category];
            embed.title += ' - ' + tag.name[0].toUpperCase() + tag.name.substring(1);

            embed.description = '';
            if (tag.deprecated) {
                embed.color = 0xff0000;
                embed.description += '**This subtag is deprecated' + (typeof tag.deprecated == 'string'
                    ? ' and has been replaced by `{' + tag.deprecated + '}`'
                    : '') + '**\n';
            }
            if (tag.staff) embed.description += '**This subtag may only be used by staff members**\n';
            if (tag.category == bu.TagType.CCOMMAND) embed.description += '**This subtag may only be used within custom commands**\n';
            embed.description += '```\n{' + [tag.name, argFactory.toString(tag.args, argsOptions)].filter(t => t.length > 0).join(';') + '}```';
            embed.description += tag.desc + '\n';

            embed.url += '/#' + encodeURIComponent(tag.name);
            embed.fields = [];
            if (tag.aliases)
                embed.fields.push({
                    name: 'Aliases',
                    value: tag.aliases.join(', ') + '\n\u200B'
                });
            else
                embed.description += '\u200B';
            if (tag.exampleCode)
                embed.fields.push({
                    name: 'Example code',
                    value: '```csharp\n' + tag.exampleCode + '```'
                });
            if (tag.exampleIn)
                embed.fields.push({
                    name: 'Example user input',
                    value: '```\n' + tag.exampleIn + '```'
                });
            if (tag.exampleOut)
                embed.fields.push({
                    name: 'Example output',
                    value: '```' + tag.exampleOut + '```'
                });

            embed.fields.push({
                name: '\u200B',
                value: '*Use `' + prefix + command + ' docs arguments` for detailed info about the argument syntax!*'
            });
            return await help.sendHelp(msg, { embed }, 'BBTag documentation', true);
    }

    return await bu.send(msg, 'Oops, I didnt recognise that topic! Try using `' + prefix + command + ' docs` for a list of all topics');
};

e.generateDebug = function (code, context, result) {
    if (arguments.length == 1)
        return (context, result) => this.generateDebug(code, context, result);

    let errors = viewErrors(...context.errors);
    let variables = Object.keys(context.variables.cache)
        .map(key => {
            let offset = ''.padStart(key.length + 2, ' ');
            let json = JSON.stringify(context.variables.cache[key].value);
            json.replace(/\n/, '\n' + offset);
            return key + ': ' + json;
        }).slice(0, 24);
    let subtags = Object.keys(context.state.subtags).map(s => {
        return {
            name: s, times: context.state.subtags[s],
            average: context.state.subtags[s].reduce((a, b) => a + b) / context.state.subtags[s].length,
            total: context.state.subtags[s].reduce((a, b) => a + b)
        };
    });
    subtags.sort((a, b) => b.average - a.average);
    subtags = subtags.map(s => `${s.name}: Average ${s.average}ms | Total ${s.total}ms\n${s.times.map(ss => ss + 'ms').join(', ')}`);
    return {
        name: 'BBTag.debug.txt',
        file: 'User input:\n' + JSON.stringify(context.input.length > 0 ? context.input : 'No input.') + '\n\n' +
            'Code Executed:\n' + code + '\n\n' +
            'Errors:\n' + (errors.length > 0 ? errors.join('\n') : 'No errors') + '\n\n' +
            'Variables:\n' + (variables.length > 0 ? variables.join('\n') : 'No variables') + '\n\n' +
            'Subtag Breakdown:\n' + subtags.join('\n\n')
    };
};

function viewErrors(...errors) {
    let result = [];
    for (const e of errors) {
        let text = '';
        if (e.tag.start == null || e.tag.end == null)
            text += 'General';
        else
            text += 'Position ' + e.tag.start + ' - ' + e.tag.end;
        text += ': ';

        if (typeof e.error == 'string') {
            result.push(text + e.error);
            continue;
        }

        let offset = ''.padStart(text.length, ' ');
        let lines = viewErrors(...e.error).map(l => offset + l);
        lines[0] = text + (lines[0] || '').substring(offset.length);
        result.push(...lines);
    }
    return result;
}
