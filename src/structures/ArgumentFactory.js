const kinds = {
    required: 'required',
    optional: 'optional',
    literal: 'literal',
    selection: 'selection'
};

const types = [
    'anything',
    'transparent',
    'string',
    'number',
    'boolean',
    'array',
    'user',
    'channel',
    'role',
    'time'
];

function require(value, types, multiple) {
    return makeArg(kinds.required, value, types, multiple);
};

function optional(value, types, multiple) {
    return makeArg(kinds.optional, value, types, multiple);
}

function literal(value, multiple) {
    return makeArg(kinds.literal, value, 'string', multiple);
}

function selection(value, multiple) {
    return makeArg(kinds.selection, value, 'transparent', multiple);
}

//accepts (string, string | [1 string] | [object | string], string | string[], boolean)
function makeArg(kind, value, types, multiple) {
    if (typeof types == 'boolean' && multiple == undefined)
        multiple = [types, types = undefined][0];
    if (!Array.isArray(value))
        value = (value == null ? [] : [value]);
    if (!Array.isArray(types))
        types = (types == null ? ['anything'] : [types]);

    if (!kind || typeof kind !== 'string')
        throw new Error('Must provide a valid type');
    if (value.length === 0)
        throw new Error('One or more values must be provided');
    if (value.length === 1 && typeof value[0] !== 'string')
        throw new Error('If only 1 argument is provided, it must be a string');
    if (kind === kinds.selection && value.length === 1)
        throw new Error('Selection arguments must be an array of values');
    if (kind === kinds.literal && value.length !== 1)
        throw new Error('Literal arguments must be a single value');
    if (kind === kinds.literal && multiple === true)
        throw new Error('Cannot have multiple of a single literal');
    if (types.find(t => typeof t !== 'string'))
        throw new Error('types must all be strings');

    return {
        content: value,
        types: types,
        kind: kind,
        multiple: multiple === true
    };
};

const defaultOptions = {
    includeTypes: false,
    brackets: {
        default: ['', ''],
        required: ['<', '>'],
        optional: ['[', ']'],
        literal: ['', ''],
        selection: ['(', ')']
    },
    separator: {
        default: ' ',
        required: ' ',
        optional: ' ',
        literal: ' ',
        selection: ' / '
    },
    multiple: '...',
    ifNone: ''
};

function toString(args, options) {
    options = Object.assign(Object.assign({}, defaultOptions), options);

    function invalid(arg) {
        return new Error('Invalid argument definition\n' + JSON.stringify(arg));
    }

    function process(arg) {
        if (typeof arg === 'string')
            return arg;
        if (typeof arg !== 'object' ||
            typeof arg.kind !== 'string' ||
            typeof arg.multiple !== 'boolean' ||
            !Array.isArray(arg.content))
            throw invalid(arg);

        let content = arg.content.map(process),
            separator = options.separator[arg.kind] || options.separator.default,
            brackets = options.brackets[arg.kind] || options.brackets.default;

        if (content.length == 1) {
            let types = arg.types[0] || 'none';
            if (arg.types.length > 1)
                types = '(' + arg.types.join('|') + ')';
            content[0] += (options.includeTypes ? ':' + types : '');
        }

        return brackets[0] +
            content.join(separator) +
            (arg.multiple ? options.multiple : '') +
            brackets[1];
    }

    if (Array.isArray(args))
        return args.map(process).join(options.separator.default);
    else if (typeof args === 'object')
        return process(args);
    else if (args == null)
        return options.ifNone;
    throw invalid(args);
}

module.exports = {
    kinds,
    require,
    optional,
    literal,
    selection,
    makeArg,
    toString
};