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

bu.processTagInner = async function (params, i) {
    if (i)
        params.content = params.args[i];
    let result = await bu.processTag(params);

    if (result.terminate)
        params.terminate = true;

    return result.contents;
};


bu.processTag = async function (params) {
    let msg = params.msg,
        words = params.words,
        contents = params.content || params.contents || '',
        fallback = params.fallback,
        author = params.author,
        tagName = params.tagName,
        terminate = params.terminate,
        isStaff = params.isStaff || await bu.isUserStaff(author, msg.guild.id);

    if (terminate) return {
        contents: contents,
        terminate: true
    };
    let openBraceCount = (contents.match(/\{/g) || []).length;
    let closeBraceCount = (contents.match(/\}/g) || []).length;
    if (openBraceCount !== closeBraceCount) return {
        contents: `\`Unmatched Brace Error\``,
        terminate: true
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
        contents
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
            msg, words, contents: args[0], fallback, author, tagName, terminate
        })).contents.toLowerCase();
        if (TagManager.list.hasOwnProperty(title)) {
            replaceObj = await TagManager.list[title].execute({
                msg: msg,
                args: args,
                fallback: fallback,
                words: words,
                author: author,
                tagName: tagName,
                ccommand: params.ccommand,
                terminate,
                isStaff
            });

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
                isStaff
            }, fallback, '`Tag doesn\'t exist`');
        }

        if (replaceObj.fallback !== undefined) {
            fallback = replaceObj.fallback;
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
                logger.debug('result.contents:', result.contents, '\ntagBrackets:', tagBrackets, '\nreplaceString:', replaceString);
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
    logger.debug(result);
    return result;
};

bu.processSpecial = (contents, final) => {
    logger.debug('Processing special tags');
    contents += '';
    contents.replace(/\uE010|\uE011/g, '');
    while (contents.indexOf(bu.specialCharBegin) > -1 && contents.indexOf(bu.specialCharEnd) > -1 &&
        contents.indexOf(bu.specialCharBegin) < contents.indexOf(bu.specialCharEnd)) {
        var tagEnds = contents.indexOf(bu.specialCharEnd),
            tagBegins = tagEnds == -1 ? -1 : contents.lastIndexOf(bu.specialCharBegin, tagEnds),
            tagBrackets = contents.substring(tagBegins, tagEnds + 1),
            tag = contents.substring(tagBegins + 1, tagEnds),
            args = tag.split(bu.specialCharDiv),
            replaceString = '',
            replace = true;

        switch (args[0].toLowerCase()) {
            case 'rb':
                if (final)
                    replaceString = '}';
                else
                    replaceString = '\uE010rb\uE011';
                break;
            case 'lb':
                if (final)
                    replaceString = '{';
                else
                    replaceString = '\uE010lb\uE011';
                break;
            case 'semi':
                if (final)
                    replaceString = ';';
                else
                    replaceString = '\uE010semi\uE011';
                break;
            case 'break':
                replaceString = '';
                break;
        }
        logger.debug(tagBrackets, replaceString);
        if (replace)
            contents = contents.replace(tagBrackets, replaceString);
    }
    return contents.replace(/\uE010/g, bu.specialCharBegin).replace(/\uE011/g, bu.specialCharEnd);
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