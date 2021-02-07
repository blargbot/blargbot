"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.argBuilder = void 0;
const newbu_1 = require("../newbu");
exports.argBuilder = {
    required(value, types, multiple) {
        return exports.argBuilder.makeArg(newbu_1.SubtagArgumentKind.REQUIRED, value, types, multiple);
    },
    optional(value, types, multiple) {
        return exports.argBuilder.makeArg(newbu_1.SubtagArgumentKind.OPTIONAL, value, types, multiple);
    },
    literal(value, multiple) {
        return exports.argBuilder.makeArg(newbu_1.SubtagArgumentKind.LITERAL, value, 'string', multiple);
    },
    selection(value, multiple) {
        return exports.argBuilder.makeArg(newbu_1.SubtagArgumentKind.SELECTION, value, 'transparent', multiple);
    },
    makeArg(kind, value, types, multiple) {
        if (!Array.isArray(value))
            value = [value];
        if (!Array.isArray(types))
            types = (types == null ? ['any'] : [types]);
        if (value.length === 0)
            throw new Error('One or more values must be provided');
        if (value.length === 1 && typeof value[0] !== 'string')
            throw new Error('If only 1 argument is provided, it must be a string');
        if (kind === newbu_1.SubtagArgumentKind.SELECTION && value.length === 1)
            throw new Error('Selection arguments must be an array of values');
        if (kind === newbu_1.SubtagArgumentKind.LITERAL && value.length !== 1)
            throw new Error('Literal arguments must be a single value');
        if (kind === newbu_1.SubtagArgumentKind.LITERAL && multiple === true)
            throw new Error('Cannot have multiple of a single literal');
        if (types.find(t => typeof t !== 'string'))
            throw new Error('types must all be strings');
        return {
            content: value,
            types: types,
            kind: kind,
            multiple: multiple === true
        };
    },
    toString(args, options) {
        const _options = options === undefined ? defaultOptions : { ...defaultOptions, ...options };
        function process(arg) {
            if (typeof arg === 'string')
                return arg;
            const content = arg.content.map(process);
            const separator = _options.separator[arg.kind] ?? _options.separator.default;
            const [open, close] = _options.brackets[arg.kind] ?? _options.brackets.default;
            const multiple = arg.multiple ? _options.multiple : '';
            if (content.length == 1 && _options.includeTypes) {
                let types = arg.types[0] ?? 'none';
                if (arg.types.length > 1)
                    types = `(${arg.types.join('|')})`;
                content[0] += ':' + types;
            }
            return `${open}${content.join(separator)}${multiple}${close}`;
        }
        return args.map(process).join(_options.separator.default);
    }
};
const defaultOptions = {
    includeTypes: false,
    brackets: {
        default: ['', ''],
        [newbu_1.SubtagArgumentKind.REQUIRED]: ['<', '>'],
        [newbu_1.SubtagArgumentKind.OPTIONAL]: ['[', ']'],
        [newbu_1.SubtagArgumentKind.LITERAL]: ['', ''],
        [newbu_1.SubtagArgumentKind.SELECTION]: ['(', ')']
    },
    separator: {
        default: ' ',
        [newbu_1.SubtagArgumentKind.REQUIRED]: ' ',
        [newbu_1.SubtagArgumentKind.OPTIONAL]: ' ',
        [newbu_1.SubtagArgumentKind.LITERAL]: ' ',
        [newbu_1.SubtagArgumentKind.SELECTION]: ' / '
    },
    multiple: '...',
    ifNone: ''
};
//# sourceMappingURL=ArgumentFactory.js.map