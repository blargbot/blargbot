const ArgumentBuilder = require('./ArgumentBuilder');

class TagBuilder {
    constructor(init) {
        this.tag = {}
        this.execute = {
            preExec: [],
            conditional: [],
            default: null
        };

        this.withProp('init', init);
        this.withProp('isTag', true);
        this.withProp('requireCtx', false);
    }

    build() {
        this.tag.execute = function (exec) {
            return async function (params) {
                try {
                    if (this.category === bu.TagType.CCOMMAND && !params.ccommand)
                        return EnsureResponse(params, await bu.tagProcessError(params, '`Can only use in CCommands`'));

                    if (this.staff && !params.isStaff)
                        return EnsureResponse(params, await bu.tagProcessError(params, '`Author must be staff`'));

                    let callback;

                    for (const c of exec.conditional) {
                        if (c.condition(params.args)) {
                            callback = c.action;
                            break;
                        }
                    }
                    callback = callback || exec.default;

                    if (callback == null)
                        throw new Error('Missing default execution on subtag ' + this.name + '\nParams:' + JSON.stringify(params));

                    for (const preExec of exec.preExec)
                        await preExec(params);

                    return EnsureResponse(params, await callback(params));
                }
                catch (e) {
                    console.error(e);
                    throw e;
                }
            }

            function EnsureResponse(params, result) {
                if (typeof result !== 'object')
                    result = {
                        replaceString: result
                    };

                if (result.terminate === undefined) result.terminate = params.terminate;
                if (result.replaceContent === undefined) result.replaceContent = false;
                if (result.replaceString === undefined) result.replaceString = '';

                return result;
            }
        }(this.execute);

        return this.tag;
    }

    requireStaff(staff) {
        return this.withProp('staff', true);
    }

    withProp(key, value) {
        this.tag[key] = value;
        return this;
    }

    withDepreciated(depreciated) {
        return this.withProp('depreciated', depreciated);
    }

    withCategory(category) {
        return this.withProp('category', category);
    }

    withName(name) {
        return this.withProp('name', name);
    }

    withArgs(args) {
        if (typeof args === 'function') {
            let builder = ArgumentBuilder.Literal;
            args(builder);
            args = builder.build();
        }
        return this.withProp('args', args);
    }

    withUsage(usage) {
        return this.withProp('usage', usage);
    }

    withDesc(desc) {
        return this.withProp('desc', desc);
    }

    withExample(input, output) {
        this.withProp('exampleIn', input);
        this.withProp('exampleOut'.output);
        return this;
    }

    beforeExecute(...actions) {
        this.execute.preExec.push(...actions);
        return this;
    }

    whenArgs(condition, action) {
        if (typeof condition === 'number')
            return this.whenArgs((args) => args.length === condition, action);
        if (typeof condition === 'string') {
            if (/^[><=!]\d+$/.test(condition)) {
                let value = parseInt(condition.substr(1));
                switch (condition[0]) {
                    case '<':
                        return this.whenArgs(args => args.length < value, action);
                    case '>':
                        return this.whenArgs(args => args.length > value, action);
                    case '!':
                        return this.whenArgs(args => args.length !== value, action);
                    case '=':
                        return this.whenArgs(value, action);
                }
            }
            if (/^(>=|<=)\d+$/.test(condition)) {
                let value = parseInt(condition.substr(2));
                switch (condition.substr(0, 2)) {
                    case '>=':
                        return this.whenArgs(args => args.length >= value, action);
                    case '<=':
                        return this.whenArgs(args => args.length <= value, action);
                }
            }
            if (/^\d+-\d+$/.test(condition)) {
                let split = condition.split('-'),
                    from = parseInt(split[0]),
                    to = parseInt(split[1]);

                if (from > to)
                    from = (to, to = from)[0];

                return this.whenArgs(args => args.length > from && args.length < to, action);
            }
            if (/^\d+$/.test(condition)) {
                return this.whenArgs(parseInt(condition), action);
            }

            throw new Error('Failed to determine conditions for ' + condition + ' for tag ' + this.name);
        }
        if (typeof condition === 'function') {
            this.execute.conditional.push({
                condition: condition,
                action: action
            });
        }
        return this;
    }

    whenDefault(execute) {
        this.execute.default = execute;
        return this;
    }
}

TagBuilder.defaults = {
    async processAllSubtags(params) {
        for (let i = 1; i < params.args.length; i++) {
            params.args[i] = await bu.processTagInner(params, i);
        }
    },
    async notEnoughArguments(params) { return await bu.tagProcessError(params, '`Not enough arguments`'); },
    async tooManyArguments(params) { return await bu.tagProcessError(params, '`Too many arguments`'); },
    async noUserFound(params) { return await bu.tagProcessError(params, '`No user found`'); },
    async noRoleFound(params) { return await bu.tagProcessError(params, '`No role found`'); },
    async noChannelFound(params) { return await bu.tagProcessError(params, '`No channel found`'); },
    async notANumber(params) { return await bu.tagProcessError(params, '`Not a number`'); }    
}

module.exports = TagBuilder;

console.info('TagBuilder loaded');