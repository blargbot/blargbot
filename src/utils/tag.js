/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:38
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-24 15:07:08
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}

bu.serializeTagArray = function (array, varName) {
    if (!varName)
        return JSON.stringify(array);

    let obj = {
        v: array,
        n: varName
    };
    return JSON.stringify(obj);
};

bu.deserializeTagArray = function (value) {
    try {
        let obj = JSON.parse(value
            .replace(/'/g, '"')
            .replace(new RegExp(bu.specialCharBegin + 'LB' + bu.specialCharEnd, "g"), '{')
            .replace(new RegExp(bu.specialCharBegin + 'RB' + bu.specialCharEnd, "g"), '}'));
        if (Array.isArray(obj)) obj = {
            v: obj
        };
        return obj;
    } catch (err) {
        return null;
    }
};

bu.getArray = async function (params, arrName) {
    let obj = bu.deserializeTagArray(arrName);
    if (!obj) {
        try {
            let arr = await TagManager.list['get'].getVar(params, arrName);
            if (arr != undefined) {
                obj = bu.deserializeTagArray(bu.serializeTagArray(arr, arrName));
            }
        } catch (err) {
            return undefined;
        }
    }
    return obj;
};

bu.setArray = async function (deserialized, params) {
    await TagManager.list['set'].setVar(params, deserialized.n, deserialized.v);
};

bu.setVariable = async function (name, key, value, type, guildId) {
    let vars = {};
    let updateObj = {};
    vars[key] = value;
    let storedThing;

    switch (type) {
        case bu.TagVariableType.GUILDLOCAL:
            updateObj.ccommands = {};
            updateObj.ccommands[name] = {};
            updateObj.ccommands[name].vars = vars;
            await r.table('guild').get(guildId).update(updateObj);
            storedThing = await bu.getGuild(guildId);
            if (!storedThing.ccommands) storedThing.ccommands = {};
            if (!storedThing.ccommands[name]) storedThing.ccommands[name] = {};
            if (!storedThing.ccommands[name].vars) storedThing.ccommands[name].vars = {};
            storedThing.ccommands[name].vars[key] = value;
            break;
        case bu.TagVariableType.TAGGUILD:
            updateObj.tagVars = vars;
            await r.table('guild').get(name).update(updateObj);
            storedThing = await bu.getGuild(name);
            if (!storedThing.tagVars) storedThing.tagVars = {};
            storedThing.tagVars[key] = value;
            break;
        case bu.TagVariableType.GLOBAL:
            let values = vars;
            await r.table('vars').update({
                varname: 'tagVars',
                values
            });
            bu.globalVars[key] = value;
            break;
        default:
            updateObj.vars = vars;
            await r.table(bu.TagVariableType.properties[type].table).get(name).update(updateObj).run();
            switch (type) {
                case bu.TagVariableType.GUILD:
                    storedThing = await bu.getGuild(name);
                    break;
                case bu.TagVariableType.LOCAL:
                    storedThing = await bu.getCachedTag(name);
                    break;
                case bu.TagVariableType.AUTHOR:
                    storedThing = await bu.getCachedUser(name);
                    break;
            }
            if (!storedThing.vars) storedThing.vars = {};
            storedThing.vars[key] = value;
            break;
    }
};

bu.getVariable = async function (name, key, type, guildId) {
    let storedThing;
    let returnVar;
    switch (type) {
        case bu.TagVariableType.GUILD:
            storedThing = await bu.getGuild(name);
            if (!storedThing.vars) storedThing.vars = {};
            returnVar = storedThing.vars[key];
            break;
        case bu.TagVariableType.GUILDLOCAL:
            storedThing = await bu.getGuild(guildId);

            if (!storedThing.ccommands[name].vars) storedThing.ccommands[name].vars = {};
            returnVar = storedThing.ccommands[name].vars[key];
            break;
        case bu.TagVariableType.TAGGUILD:
            storedThing = await bu.getGuild(name);
            if (!storedThing.tagVars) storedThing.tagVars = {};
            returnVar = storedThing.tagVars[key];
            break;
        case bu.TagVariableType.AUTHOR:
            storedThing = await bu.getCachedUser(name);
            if (!storedThing.vars) storedThing.vars = {};
            returnVar = storedThing.vars[key];
            break;
        case bu.TagVariableType.LOCAL:
            storedThing = await bu.getCachedTag(name);
            if (!storedThing.vars) storedThing.vars = {};
            returnVar = storedThing.vars[key];
            break;
        case bu.TagVariableType.GLOBAL:
            returnVar = await bu.getCachedGlobal(key);
            break;
        default:
            storedThing = await r.table(bu.TagVariableType.properties[type].table).get(name);
            if (!storedThing.vars)
                storedThing.vars = {};
            returnVar = storedThing.vars[key];
            break;
    }
    return returnVar;
};

bu.tagVariableScopes = [
    {
        name: 'Server',
        prefix: '_',
        description: 'Server variables (also referred to as Guild variables) are commonly used if you wish to store data on a per server level. ' +
            'They are however stored in 2 separate \'pools\', one for tags and one for custom commands, meaning they cannot be used to pass data between the two\n' +
            'This makes then very useful for communicating data between tags that are intended to be used within 1 server at a time.',
        setter: async (params, name, value) =>
            await bu.setVariable(params.msg.guild.id, name, value,
                params.ccommand ? bu.TagVariableType.GUILD : bu.TagVariableType.TAGGUILD),
        getter: async (params, name) =>
            await bu.getVariable(params.msg.guild.id, name,
                params.ccommand ? bu.TagVariableType.GUILD : bu.TagVariableType.TAGGUILD)
    },
    {
        name: 'Author',
        prefix: '@',
        description: 'Author variables are stored against the author of the tag, meaning that only tags made by you can access or edit your author variables.\n' +
            'These are very useful when you have a set of tags that are designed to be used by people between servers, effectively allowing servers to communicate with eachother.',
        setter: async (params, name, value) => {
            if (params.author)
                return await bu.setVariable(params.author, name, value, bu.TagVariableType.AUTHOR);
            return await bu.tagProcessError(params, '`No author found`');
        },
        getter: async (params, name) => {
            if (params.author)
                return await bu.getVariable(params.author, name, bu.TagVariableType.AUTHOR);
            return await bu.tagProcessError(params, '`No author found`');
        }
    },
    {
        name: 'Global',
        prefix: '*',
        description: 'Global variables are completely public, anyone can read **OR EDIT** your global variables.\n' +
            'These are very useful if you like pain.',
        setter: async (params, name, value) =>
            await bu.setVariable(undefined, name, value, bu.TagVariableType.GLOBAL),
        getter: async (params, name) =>
            await bu.getVariable(undefined, name, bu.TagVariableType.GLOBAL)
    },
    {
        name: 'Temporary',
        prefix: '~',
        description: 'Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\n' +
            'If you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type',
        setter: async (params, name, value) => { params.vars[name] = value; },
        getter: async (params, name) => params.vars[name]
    },
    {
        name: 'Tag',
        prefix: '',
        description: 'Tag variables are the default variable type, only usable if your variable name doesnt start with one of the other prefixes. ' +
            'These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\n' +
            'These are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag',
        setter: async (params, name, value) => {
            if (params.ccommand)
                return await bu.setVariable(params.tagName, name, value, bu.TagVariableType.GUILDLOCAL, params.msg.guild.id);
            return await bu.setVariable(params.tagName, name, value, bu.TagVariableType.LOCAL);
        },
        getter: async (params, name) => {
            if (params.ccommand)
                return await bu.getVariable(params.tagName, name, bu.TagVariableType.GUILDLOCAL, params.msg.guild.id);
            return await bu.getVariable(params.tagName, name, bu.TagVariableType.LOCAL);
        }
    }
];

bu.processTagInner = async function (params, i) {
    if (i)
        params.content = params.args[i];
    let result = await bu.processTag(params);

    // if (result.trim)
    //     result.contents = result.contents.replace(/^[\s\n]+|[\s\n]+$/g, '');

    if (result.terminate)
        params.terminate = true;

    if (!Array.isArray(params.reactions))
        params.reactions = [];
    params.reactions.push(...(result.reactions || []));

    return result.contents;
};


bu.processTag = async function (params) {
    let { msg, words, contents, fallback, author, tagName, terminate, isStaff, vars, reactions, quiet } = params;
    if (params.content) contents = params.content;
    if (!contents) contents = '';
    if (isStaff === undefined)
        isStaff = author == params.msg.guild.id || await bu.isUserStaff(author, msg.guild.id);
    if (vars === undefined) vars = {};

    if (terminate) return {
        contents: contents,
        terminate: true,
        reactions
    };

    let openBraceCount = (contents.match(/\{/g) || []).length;
    let closeBraceCount = (contents.match(/\}/g) || []).length;
    if (openBraceCount !== closeBraceCount) return {
        contents: `\`Unmatched Brace Error\``,
        terminate: true,
        reactions
    };

    let level = 0;
    let lastIndex = 0;
    let coords = [];
    for (let i = 0; i < contents.length; i++) {
        if (contents[i] == '{') {
            if (level == 0) {
                lastIndex = i;
            }
            level++;
        } else if (contents[i] == '}') {
            level--;
            if (level == 0) {
                coords.push([lastIndex, i + 1]);
            }
        } else if (contents[i] == ';') {
            if (level == 1) {
                contents = setCharAt(contents, i, bu.tagDiv);
            }
        }
    }
    let subtags = [];
    for (let i = 0; i < coords.length; i++) {
        let subtagindex = subtags.push(contents.substring(coords[i][0], coords[i][1]));
    }
    let result = {
        contents, reactions
    };
    for (let i = 0; i < subtags.length; i++) {
        let tagBrackets = subtags[i],
            tag = tagBrackets.substring(1, tagBrackets.length - 1),
            args = tag.split(bu.tagDiv),
            replaceString, replaceObj = {
                replaceString: '',
                replaceContent: false
            };
        for (let ii = 0; ii < args.length; ii++) {
            args[ii] = args[ii].replace(/^[\s\n]+|[\s\n]+$/g, '');
        }
        let title = (await bu.processTag({
            msg, words, contents: args[0], fallback, author, tagName, terminate, vars, reactions, quiet
        })).contents.toLowerCase();

        if (i === 0 || i === subtags.length - 1 && title === '//')
            result.trim = true;

        if (TagManager.list.hasOwnProperty(title)) {
            let parameters = {
                msg: msg,
                args: args,
                fallback: fallback,
                words: words,
                author: author,
                tagName: tagName,
                ccommand: params.ccommand,
                terminate,
                isStaff, vars, reactions, quiet
            };
            if (TagManager.list[title].category == bu.TagType.CCOMMAND && !params.ccommand) {
                replaceObj = {
                    replaceString: await bu.tagProcessError(params, '`Can only use {' + title + '} in CCommands`'),
                    terminate,
                    replaceContent: false,
                    reactions
                };
            } else
                try {
                    replaceObj = await TagManager.list[title].execute(parameters);
                } catch (err) {
                    if (err.stack) {
                        replaceObj.replaceString = await bu.tagProcessError({
                            msg: msg,
                            contents: fallback,
                            fallback: fallback,
                            words: words,
                            author: author,
                            tagName: tagName,
                            ccommand: params.ccommand,
                            terminate,
                            isStaff, vars, reactions, quiet
                        }, `\`An internal error occurred. This has been reported.\``);
                        bu.send('250859956989853696', {
                            content: 'A tag error occurred.',
                            embed: {
                                title: err.message,
                                description: err.stack,
                                fields: [
                                    { name: 'Tag Name', value: tagName, inline: true },
                                    { name: 'Channel | Guild', value: `${msg.channel.id} | ${msg.guild.id}`, inline: true },
                                    { name: 'CCommand', value: params.ccommand ? 'Yes' : 'No', inline: true }
                                ]
                            }
                        })
                    } else replaceObj = { terminate: true, replaceString: '', reactions };
                }
        } else {
            replaceObj.replaceString = await bu.tagProcessError({
                msg: msg,
                contents: fallback,
                fallback: fallback,
                words: words,
                author: author,
                tagName: tagName,
                ccommand: params.ccommand,
                terminate,
                isStaff, vars, reactions, quiet
            }, `\`Subtag "${title}" doesn\'t exist\``);
        }

        if (replaceObj.fallback !== undefined) {
            fallback = replaceObj.fallback;
        }
        if (replaceObj.quiet !== undefined){
            quiet = replaceObj.quiet;
        }
        if (replaceObj.reactions !== undefined) {
            result.reactions = reactions = replaceObj.reactions;
        }
        if (replaceObj.terminate) {
            result.contents = result.contents.substring(0, result.contents.indexOf(tagBrackets) + tagBrackets.length);
            result.terminate = true;
        }
        if (replaceObj == '') {
            return bu.specialCharBegin + 'BREAK' + bu.specialCharEnd;
        } else {
            replaceString = replaceObj.replaceString;
            if (replaceString == undefined) {
                replaceString = '';
            }
            if (replaceString == bu.specialCharBegin + 'BREAK' + bu.specialCharEnd) {
                result.contents = bu.specialCharBegin + 'BREAK' + bu.specialCharEnd;
            } else {
                replaceString = replaceString.toString();
                replaceString = replaceString.replace(/\}/gi, `${bu.specialCharBegin}RB${bu.specialCharEnd}`)
                    .replace(/\{/gi, `${bu.specialCharBegin}LB${bu.specialCharEnd}`)
                    .replace(/\;/g, `${bu.specialCharBegin}SEMI${bu.specialCharEnd}`);
                console.debug('result.contents:', result.contents, '\ntagBrackets:', tagBrackets, '\nreplaceString:', replaceString);
                result.contents = result.contents.replace(tagBrackets, replaceString);
                if (replaceObj.replaceContent) {
                    if (replaceObj.replace == undefined) {
                        result.contents = replaceObj.replaceString;
                    } else {
                        result.contents.replace(tagBrackets, '');
                        result.contents = result.contents.replace(replaceObj.replace, replaceObj.replaceString);
                    }
                }
            }
        }
        if (result.terminate) break;
    }
    console.debug(result);
    return result;
};

bu.processSpecial = (contents, final) => {
    console.debug('Processing special tags');
    contents += '';
    if (final)
        contents = contents
            .replace(new RegExp(bu.specialCharBegin + 'rb' + bu.specialCharEnd, 'gi'), '}')
            .replace(new RegExp(bu.specialCharBegin + 'lb' + bu.specialCharEnd, 'gi'), '{')
            .replace(new RegExp(bu.specialCharBegin + 'semi' + bu.specialCharEnd, 'gi'), ';')

    contents = contents
        .replace(new RegExp(bu.specialCharBegin + 'break' + bu.specialCharEnd, 'gi'), '')

    // while (contents.indexOf(bu.specialCharBegin) > -1 && contents.indexOf(bu.specialCharEnd) > -1 &&
    //     contents.indexOf(bu.specialCharBegin) < contents.indexOf(bu.specialCharEnd)) {
    //     var tagEnds = contents.indexOf(bu.specialCharEnd),
    //         tagBegins = tagEnds == -1 ? -1 : contents.lastIndexOf(bu.specialCharBegin, tagEnds),
    //         tagBrackets = contents.substring(tagBegins, tagEnds + 1),
    //         tag = contents.substring(tagBegins + 1, tagEnds),
    //         args = tag.split(bu.specialCharDiv),
    //         replaceString = '',
    //         replace = true;

    //     switch (args[0].toLowerCase()) {
    //         case 'rb':
    //             if (final)
    //                 replaceString = '}';
    //             else
    //                 replaceString = '\uE010rb\uE011';
    //             break;
    //         case 'lb':
    //             if (final)
    //                 replaceString = '{';
    //             else
    //                 replaceString = '\uE010lb\uE011';
    //             break;
    //         case 'semi':
    //             if (final)
    //                 replaceString = ';';
    //             else
    //                 replaceString = '\uE010semi\uE011';
    //             break;
    //         case 'break':
    //             replaceString = '';
    //             break;
    //     }
    //     console.debug(tagBrackets, replaceString);
    //     if (replace)
    //         contents = contents.replace(tagBrackets, replaceString);
    // }
    // return contents.replace(/\uE010/g, bu.specialCharBegin).replace(/\uE011/g, bu.specialCharEnd);
    return contents;
};

bu.getTagRole = async function (msg, args, index) {
    var obtainedRole;
    if (!index) index = 1;
    msg.content = bu.processSpecial(msg.content);
    return await bu.getRole(msg, args[index], args[index + 1]);
};

bu.getTagUser = async function (msg, args, index) {
    var obtainedUser;
    if (!index) index = 1;

    msg.content = bu.processSpecial(msg.content);
    if (args.length <= index) {
        obtainedUser = msg.author;
    } else {
        if (args[index + 1]) {
            obtainedUser = await bu.getUser(msg, args[index], true);
        } else {
            obtainedUser = await bu.getUser(msg, args[index]);
        }
    }
    return obtainedUser;
};


bu.tagGetFloat = (arg) => {
    return parseFloat(arg) ? parseFloat(arg) : NaN;
};

bu.tagProcessError = async function (params, errormessage) {
    let fallback = params.fallback;
    let returnMessage = {};
    params.content = fallback;

    if (fallback === undefined) returnMessage.contents = errormessage;
    else returnMessage = await bu.processTag(params);
    if (returnMessage.terminate) params.terminate = true;
    return returnMessage.contents;
};