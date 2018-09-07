'use strict';

const Context = require('./Context');
const { BBTag, SubTag } = require('./Tag');
const Timer = require('../Timer');

/**
 * Parses the given text as BBTag
 * @param {string} content The text to parse
 * @returns {{success: boolean, bbtag?: BBTag, error?: string}}
 */
function parse(content) {
    let bbtag = BBTag.parse(content);
    if (bbtag.content.length != bbtag.source.length)
        return { success: false, error: 'Unexpected \'}\' at ' + (bbtag.content.length) };
    let errors = bbtag.validate();
    if (errors.length > 0)
        return { success: false, error: errors[0].message + ' at ' + errors[0].position };
    return { success: true, bbtag };
}

/**
 * This will execute all SubTags contained within a given BBTag element,
 * and then return the string to replace the BBTag element with
 * @param {BBTag} bbtag The BBTag node to begin execution at
 * @param {Context} context The context to be used for execution
 * @returns {string}
 */
async function execute(bbtag, context) {
    if (!context.guild) return;
    if (!(bbtag instanceof BBTag))
        throw new Error('Execute can only accept BBTag as its first parameter');
    let result = [],
        startOffset = (bbtag.content.match(/^[\s\n\r]*/) || [''])[0].length,
        endOffset = (bbtag.content.match(/[\s\n\r]*$/) || [''])[0].length,
        prevIndex = bbtag.start + startOffset,
        content = bbtag.source;

    context.scopes.beginScope();
    if (context.state.return == 0) { // only iterate if return state is 0
        for (const subtag of bbtag.children) {
            result.push(content.slice(prevIndex, subtag.start));
            prevIndex = subtag.end;

            if (subtag.children.length == 0) {
                result.push(addError(subtag, context, 'Missing SubTag declaration'));
                continue;
            }
            let name = await execute(subtag.children[0], context);
            let definition, runSubtag;

            if (!context.state.overrides)
                context.state.overrides = {};

            if (context.state.overrides.hasOwnProperty(name.toLowerCase())) {
                runSubtag = context.state.overrides[name.toLowerCase()];
                definition = { name: name.toLowerCase() };
            } else {
                definition = TagManager.get(name.toLowerCase()) || {};
                runSubtag = context.state.overrides[definition.name] || definition.execute;
            }

            if (runSubtag == null) {
                result.push(addError(subtag, context, 'Unknown subtag ' + name));
                continue;
            }
            subtag.name = name;

            let limitError = await checkLimits(context, subtag, definition);
            if (limitError) {
                result.push(limitError);
                continue;
            }

            try {
                result.push(await runSubtag(subtag, context));
            } catch (err) {
                if (err instanceof RangeError) {
                    bu.send(context.msg.channel.id, 'The tag execution has been halted: ' + err.message);
                    throw err;
                }
                result.push(addError(subtag, context, 'An internal server error has occurred'));
                bu.send('250859956989853696', {
                    content: 'A tag error occurred.',
                    embed: {
                        title: err.message || (typeof err == 'string' ? err : JSON.stringify(err)),
                        description: err.stack || 'No error stack!',
                        color: bu.parseColor('red'),
                        fields: [
                            { name: 'SubTag', value: definition.name, inline: true },
                            { name: 'Arguments', value: JSON.stringify(subtag.children.map(c => c.content.length < 100 ? c.content : c.content.substr(0, 97) + '...')) },
                            { name: 'Tag Name', value: context.tagName, inline: true },
                            { name: 'Location', value: `${subtag.range.toString()}`, inline: true },
                            { name: 'Channel | Guild', value: `${context.channel.id} | ${context.guild.id}`, inline: true },
                            { name: 'CCommand', value: context.isCC ? 'Yes' : 'No', inline: true }
                        ]
                    }
                });
                console.error(err);
            }
            if (context.state.return != 0)
                break;
        }
    }
    if (context.state.return == 0)
        result.push(content.slice(prevIndex, Math.max(prevIndex, bbtag.end - endOffset)));
    context.scopes.finishScope();
    return result.join('');
}

async function checkLimits(context, subtag, definition) {
    let limit = context.state.limits[definition.name];
    if (limit) {
        if (limit.disabled) {
            let scope = context.state.limits._name
                ? `in ${context.state.limits._name}s`
                : `for this trigger`;
            return addError(subtag, context, `{${definition.name}} is disabled ${scope}`);
        }
        if (limit.staff) {
            let isStaff = await context.isStaff;
            if (!isStaff) {
                return addError(subtag, context, 'Authorizer must be staff');
            }
        }
        if (limit.count !== undefined) {
            if (limit.count === 0) {
                return addError(subtag, context, 'Usage limit reached for ' + definition.name);
            } else {
                limit.count--;
            }
        }
        if (limit.check !== undefined) {
            if (limit.check in checks) {
                let result = await checks[limit.check](context, subtag);
                if (typeof result === 'boolean' && result) {
                    return addError(subtag, context, 'Usage limit reached for ' + definition.name);
                } else if (result) {
                    return addError(subtag, context, result);
                }
            }
        }
    }
}

/**
 * Parses a string as BBTag and executes it
 * @param {string} string The string content of BBTag to execute
 * @param {Context} context The context to perform execution in
 * @returns {string} The string result from executing the string
 */
async function execString(string, context) {
    let parsed = parse(string);
    if (!parsed.success)
        return addError({}, context, parsed.error);
    return await execute(parsed.bbtag, context);
}

/**
 * Adds an error in the place of the tag
 * @param {BaseTag} tag The tag which contained the error
 * @param {Context} context The context in which the error will be places
 * @param {string} message The error message to show
 * @returns {string} The formatted error message
 */
function addError(tag, context, message) {
    if (typeof message == 'string')
        message = '`' + message + '`';
    context.errors.push({ tag: tag, error: tag.name + ': ' + message });
    if (context.scope.fallback == null)
        return message;
    return context.scope.fallback;
}

/**
 * @typedef {Object} runArgs
 * @property {Object} runArgs.msg The message that triggered this tag.
 * @property {string} runArgs.tagContent The content of the tag to be run
 * @property {string} runArgs.input The input provided to the tag
 * @property {boolean} runArgs.isCC Is the context a custom command context
 * @property {function(string):(Promise<string>|string)} runArgs.outputModify Modifies the result before it is sent
 * @property {string} [runArgs.tagName] The name of the tag being run
 * @property {string} [runArgs.author] The ID of the author of the tag being run
 * @property {function(Context,string):{name:string,file:string}} [runArgs.attach] A function to generate an attachment
 */

/**
 * Either provide a string and Context, or runArgs and Context is optional
 * @param {runArgs|string} content
 * @param {Context} [context]
 */
async function runTag(content, context) {
    console.bbtag('Start run tag');
    let timer = new Timer().start();
    let config = {};
    if (typeof content == 'string') {
        if (!(context instanceof Context))
            throw new Error('Unable to build a context with the given args');
    }
    else {
        if (context == null)
            context = new Context(content);
        config = content;
        content = content.tagContent;
    }
    console.bbtag('Created context in', timer.poll(true), 'ms');

    if (context.cooldowns[context.tagName]) {
        let cdDate = context.cooldowns[context.tagName] + (context.cooldown || 0);
        let diff = Date.now() - cdDate;
        if (diff < 0) {
            let f = Math.floor(diff / 100) / 10;
            await bu.send(context.msg, `This ${context.isCC ? 'tag' : 'custom command'} is currently under cooldown. Please try again in ${f * -1} seconds.`);
            return;
        }
    }
    context.cooldowns[context.tagName] = Date.now();

    console.bbtag('Checked cooldowns in', timer.poll(true), 'ms');

    context.execTimer.start();
    if (content === undefined) {
        console.log(context.guild.id);
    }
    let result = (await execString((content || '').trim(), context) || '').trim();
    context.execTimer.end();

    console.bbtag('Tag run complete in', timer.poll(true), 'ms');

    await context.variables.persist();

    console.bbtag('Saved variables in', timer.poll(true), 'ms');

    if (typeof result == 'object')
        result = await result;

    if (result != null && context.state.replace != null)
        result = result.replace(context.state.replace.regex, context.state.replace.with);

    if (context.state.embed == null && (result == null || result.trim() == '')) {
        return { context, result, response: null };
    }

    let attachment = (config.attach || (() => null))(context, result);
    let response = await context.sendOutput(result, attachment);

    bu.Metrics.bbtagExecutions.labels(context.isCC ? 'custom command' : 'tag').inc();
    return { context, result, response };
};

/** @type {{[key:string]: (context: Context, subtag: SubTag) => boolean | string | Promise<boolean | string>}} */
const checks = {};

module.exports = {
    parse,
    execute,
    execString,
    addError,
    runTag,
    checks
};

/**
 * @typedef {Object} BaseTagProtected
 * @property {string} BaseTagPrivate.source
 * @property {BaseTag} [BaseTagPrivate.parent]
 * @property {BaseTag[]} BaseTagPrivate.children
 * @property {number} start
 * @property {number} end
 */

/**
 * @typedef {Object} StateScope
 * @property {boolean} StateScope.quiet
 * @property {string} StateScope.fallback
 */

 /**
 * @typedef {Object} bbError An error that ocurred while executing BBTag
 * @property {BaseTag} bbError.tag The loacation that the error ocurred
 * @property {string|bbError[]} bbError.error The error that happened
 */
