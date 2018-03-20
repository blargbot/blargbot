'use strict';
/**
 * This represents a block of text within the BBTag language.
 */
class BaseTag {

    get source() { return this._protected.source; }
    get start() { return this._protected.start; }
    get end() { return this._protected.end; }
    get content() { return this.source.slice(this.start, this.end); }
    get parent() { return this._protected.parent; }
    get children() { return this._protected.children; }

    /** @param {string|BaseTag} parent The parent of this tag */
    constructor(parent) {
        /**
         * The protected properties of this tag
         * @type {BaseTagProtected}
         * @protected
         */
        this._protected = {
            children: []
        };
        if (typeof parent == 'string')
            this._protected.source = parent;
        else {
            this._protected.parent = parent;
            this._protected.source = parent.source;
        }
    }
}

/**
 * This represents both the top level text, and the contents of each argument in a subtag.
 * A subtag is a block of text between and including a {} pair, with arguments delimited by ;
 */
class BBTag extends BaseTag {
    /**
     * Attempts to create a BBTag object from the given values.
     * @param {string|SubTag} parent The parent to use for creation of this BBTag instance
     * @param {StringIterator} iterator The start position of this BBTag instance
     */
    static parse(parent, iterator = null) {
        if (typeof parent != 'string' && iterator == null)
            throw ('Must supply an iterator when parent is not a string');
        iterator = iterator || new StringIterator(parent);
        let result = new BBTag(parent);
        result._protected.start = iterator.current;

        do {
            if (iterator.nextChar == '}') break;
            if (iterator.nextChar == ';') break;
            if (iterator.nextChar == '{') {
                result._protected.children.push(SubTag.parse(result, iterator));
                iterator.moveBack();
            }
        } while (iterator.moveNext());

        result._protected.end = iterator.current;
        return result;
    }

    /** @param {string|SubTag} parent */
    constructor(parent) { super(parent); }
}


/**
 * This represents a recognized subtag structure. Subtags are strings starting and ending with {}
 * And contain sections of BBTag delimited by ;
 */
class SubTag extends BaseTag {
    /**
     * Attempts to create a SubTag object from the given values.
     * @param {BBTag} parent The parent to use for creation of this SubTag instance
     * @param {StringIterator} iterator The start position of this SubTag instance
     */
    static parse(parent, iterator) {
        let result = new SubTag(parent);
        result._protected.start = iterator.current;

        while (iterator.moveNext()) {
            if (iterator.prevChar == '}') break;
            result._protected.children.push(BBTag.parse(result, iterator));
        }

        result._protected.end = iterator.current;
        return result;
    }


    /** @param {string|SubTag} parent */
    constructor(parent) { super(parent); }
}

class BBTagExecContext {
    get channel() { return this.message.channel; }
    get member() { return this.message.member; }
    get guild() { return this.message.channel.guild; }
    get user() { return this.message.author; }

    /**
     * Creates a new BBTagExecContext instance
     * @param {Object} message The message that this context is regarding
     * @param {string[]} input The input the user gave to the bot
     * @param {boolean} isCC If the tag is to be executed in the context of a custom command
     */
    constructor(message, input, isCC) {
        this.message = this.msg = message;
        this.input = this.input = input;
        this.isCC = isCC;
        /** @type {SubTag} */
        this.subtag = null;

        /** @type {{subtag: SubTag, error: string}[]} */
        this.errors = [];
        this.scopes = new StateScopes();
        this.variables = new VariableCache();
        this.state = {
            /** @type {number} */
            return: 0,
            /** @type {Object} */
            embed: null,
            /** @type {string[]} */
            reactions: [],
            /** @type {string} */
            nsfw: null,
            /** @type {number} */
            dmCount: 0,
            /** @type {number} */
            timerCount: 0,
            /** @type {{replace: string, with: string}} */
            replace: null
        };
    }
}

class StateScopes {
    constructor() {
        /** @type {StateScope[]} */
        this._scopes = [{}];
    }

    local() { return this._scopes[this._scopes.length - 1]; };
    get(offset) { return this._scopes[this._scopes.length - 1 - offset]; }

    beginScope() {
        this._scopes.push(Object.assign({}, this.local));
    }

    finishScope() {
        this._scopes.pop();
    }
}

class VariableCache {
    constructor(parent) {
        this.parent = parent;
        this.cache = {};
    }

    /** @param {string} variable The name of the variable to retrieve @returns {string}*/
    async get(variable) {
        if (this.cached[variable] == undefined) {
            for (const scope of bu.tagVariableScopes) {
                if (variable.startsWith(scope.prefix))
                    this.cached[variable] = await scope.getter(this.parent, variable.substring(scope.prefix.length));
            }
        }
        if (this.cached[variable] == undefined)
            throw ('Missing default variable scope!');
        return this.cached[variable];
    }

    /**
     * @param {string} variable The variable to store
     * @param {string} value The value to set the variable to
     */
    async set(variable, value) {
        this.cached[variable] = value;
    }
}

/**
 * A tool to navigate a string. Used to communicate between scopes
 * @prop {number} current The current cursor position. This is always between characters, or at the start/end of the string
 * @prop {string} content The text that this iterator is for
 */
class StringIterator {
    /** Gets the character after the current cursor position */
    get nextChar() { return this.content.slice(this.current, this.current + 1); }
    /** Gets the character before the current cursor position */
    get prevChar() { return this.content.slice(Math.max(0, this.current - 1), this.current); }

    constructor(text) {
        this.content = text;
        this.current = 0;
    }

    /** Attempts to move the cursor 1 place forwards. If successful, it returns `true`, otherwise `false` */
    moveNext() {
        if (this.current != this.content.length) {
            this.current += 1;
            return true;
        }
        return false;
    }

    /** Attempts to move the cursor 1 place backwards. If successful, it returns `true`, otherwise `false` */
    moveBack() {
        if (this.current != 0) {
            this.current -= 1;
            return true;
        }
        return false;
    }
}

/**
 * Parses the given text as BBTag
 * @param {string} content The text to parse
 * @returns {{success: boolean, bbtag?: BBTag, error?: string}}
 */
function parse(content) {
    let bbtag = BBTag.parse(content);
    if (bbtag.content.length != bbtag.source.length)
        return { success: false, error: 'Unexpected `}` at ' + bbtag.content.length - 1 };
    let error = bbtag.children.find(c => !c.content.endsWith('}'));
    if (error != null)
        return { success: false, error: 'Unmatched `{` at ' + error.start };
    return { success: true, bbtag };
}

/**
 * This will execute all SubTags contained within a given BBTag element,
 * and then return the string to replace the BBTag element with
 * @param {BBTag} bbtag The BBTag node to begin execution at
 * @param {BBTagExecContext} context The context to be used for execution
 * @returns {string}
 */
async function execute(bbtag, context) {
    let result = [], prevIndex = bbtag.start, content = bbtag.source;
    context.scopes.beginScope();
    for (const subtag of bbtag.children) {
        result.push(content.slice(prevIndex, subtag.start));
        prevIndex = subtag.end;

        if (subtag.children.length == 0) {
            result.push(addError(subtag, context, 'Missing SubTag declaration'));
            continue;
        }
        let name = await execute(subtag.children[0], context);
        let definition = TagManager.list[name];
        if (definition == null) {
            result.push(addError(subtag, context, 'Unknown subtag ' + name));
            continue;
        }

        result.push(await definition.execute(subtag, context));
        if (context.state.return != 0)
            break;
    }
    if (context.state.return == 0)
        result.push(content.slice(prevIndex, bbtag.end));
    context.scopes.finishScope();
    return result.join('');
}

/**
 * Adds an error in the place of the subtag
 * @param {BBTagExecContext} context The context in which the error will be places
 * @param {string} message The error message to show
 * @returns {string} The formatted error message
 */
function addError(context, message) {
    message = '`' + message + '`';
    context.errors.push({ subtag: context.subtag, message });
    return message;
}

module.exports = {
    BBTag,
    SubTag,
    BBTagExecContext,
    parse,
    execute,
    addError
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
  */