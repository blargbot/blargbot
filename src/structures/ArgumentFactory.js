const types = {
  required: 'required',
  optional: 'optional',
  literal: 'literal',
  selection: 'selection'
};

function require(value, multiple) {
  return makeArg(types.required, value, multiple);
};

function optional(value, multiple) {
  return makeArg(types.optional, value, multiple);
}

function literal(value, multiple) {
  return makeArg(types.optional, value, multiple);
}

function selection(value, multiple) {
  return makeArg(types.optional, value, multiple);
}

//accepts (string, string | [1 string] | [object | string], boolean)
function makeArg(type, value, multiple) {
  if (typeof value === 'string')
    value = [value];
  else if (!type || typeof type !== 'string')
    throw new Error('Must provide a valid type');
  else if (!Array.isArray(value))
    throw new Error('Can only accept \'string\' or \'Array\' values');
  else if (value.length === 0)
    throw new Error('One or more values must be provided');
  else if (value.length === 1 && typeof value[0] !== 'string')
    throw new Error('If only 1 argument is provided, it must be a string');
  else if (type === types.selection && value.length === 1)
    throw new Error('Selection arguments must be an array of values');
  else if (type === types.literal && value.length !== 1)
    throw new Error('Literal arguments must be a single value');
  else if (type === types.literal && multiple === true)
    throw new Error('Cannot have multiple of a single literal');

  return {
    content: value,
    type: type,
    multiple: multiple === true
  };
};

const defaultOptions = {
  brackets: {
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
    selection: ' | '
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
      typeof arg.type !== 'string' ||
      typeof arg.multiple !== 'boolean' ||
      !Array.isArray(arg.content))
      throw invalid(arg);

    let content = arg.content.map(process),
      separator = options.separator[arg.type],
      brackets = options.brackets[arg.type];

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
  types,
  require,
  optional,
  literal,
  selection,
  makeArg,
  toString
};