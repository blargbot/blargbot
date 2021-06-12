import { FlagDefinition, FlagResult, humanize, parse } from '../../utils';
import { CommandDefinition, CommandHandler, CommandParameter, CommandSignatureHandler } from './types';

interface ChildCommandTree extends CommandTree {
    readonly name: CommandParameter;
}

interface CommandTree {
    readonly switch: { [key: string]: ChildCommandTree | undefined };
    readonly tests: VariableCommandTree[];
    handler?: CommandSignatureHandler;
}

interface VariableCommandTree {
    readonly check: (arg: string) => boolean;
    readonly node: ChildCommandTree;
}

export function compileHandler(definition: CommandDefinition, flagDefinitions: readonly FlagDefinition[]): CommandHandler {
    const tree = buildTree(definition, flagDefinitions);
    return {
        signatures: [...buildUsage(tree)],
        execute: (context) => {
            let node = tree;
            args: for (const arg of context.args) {
                // TODO improve traversal here
                const switched = node.switch[arg.toLowerCase()];
                if (switched) {
                    node = switched;
                    continue args;
                }
                for (const test of node.tests) {
                    if (test.check(arg)) {
                        node = test.node;
                        continue args;
                    }
                }
                if (node.handler)
                    return node.handler.execute(context, context.args);

                const expected = [...buildUsage(node)].map(u => `\`${u[0].display}\``);
                return `❌ Invalid arguments! Expected ${humanize.smartJoin(expected, ', ', ' or ')} but got \`${arg}\``;

            }

            if (node.handler)
                return node.handler.execute(context, context.args);

            const expected = [...buildUsage(node)].map(u => `\`${u[0].display}\``);
            return `❌ Not enough arguments! Expected ${humanize.smartJoin(expected, ', ', ' or ')}`;
        }
    };
}

function buildTree(
    definition: CommandDefinition,
    flagDefinitions: readonly FlagDefinition[]
): CommandTree {
    const tree: CommandTree = { switch: {}, tests: [] };
    populateTree(definition, flagDefinitions, tree, []);
    return tree;
}

function populateTree(
    definition: CommandDefinition,
    flagDefinitions: readonly FlagDefinition[],
    tree: CommandTree,
    path: CommandParameter[]
): void {
    if ('subcommands' in definition) {
        for (const key of Object.keys(definition.subcommands)) {
            const subDefinition = definition.subcommands[key];
            const _path = [...path];
            let _node = tree;
            for (const parameter of compileParameters(key)) {
                _path.push(parameter);
                switch (parameter.type) {
                    case 'literal': {
                        const nextNode = _node.switch[parameter.name.toLowerCase()] ??= { switch: {}, tests: [], name: parameter };
                        if (parameter !== parameter)
                            throw new Error(`Conflicting subcommand ${parameter.name}`);
                        for (const alias of parameter.alias) {
                            const aliasNode = _node.switch[alias] ??= nextNode;
                            if (aliasNode !== nextNode)
                                throw new Error(`Conflicting subcommand '${alias}'`);
                        }
                        _node = nextNode;
                        break;
                    }
                    case 'variable': {
                        const nextNode: ChildCommandTree = { switch: {}, tests: [], name: parameter };
                        const parse = getParser(parameter.valueType);
                        _node.tests.push({
                            check: str => parse(str) !== undefined,
                            node: nextNode
                        });
                        _node = nextNode;
                        break;
                    }
                    default: throw new Error(`Unexpected parameter type '${(<CommandParameter>parameter).type}'`);
                }
            }
            populateTree(subDefinition, flagDefinitions, _node, _path);
        }
    }

    if ('execute' in definition) {
        if (tree.handler !== undefined)
            throw new Error(`Duplicate handler '${path.map(p => p.display).join(' ')}' found!`);

        const parameters = [...compileParameters(definition.parameters ?? '')];
        const restParams = parameters.filter(p => p.type === 'variable' && p.rest);

        if (restParams.length > 1)
            throw new Error(`Cannot have more than 1 rest parameter, but found ${restParams.map(p => p.name).join(',')}`);
        if (restParams.length === 1 && parameters[parameters.length - 1] !== restParams[0])
            throw new Error('Rest parameters must be the last parameter of a command');

        const strictFlags = definition.strictFlags ?? false;
        const binder = definition.dontBind ?? false
            ? (args: readonly string[]) => args
            : compileArgBinder(path, parameters, definition.allowOverflow ?? false);

        const getArgs = (definition.useFlags ?? flagDefinitions.length > 0)
            ? (_args: readonly string[], flags: FlagResult) => flags.undefined
            : (args: readonly string[], _flags: FlagResult) => args;

        tree.handler = {
            description: definition.description,
            parameters,
            execute: (context, args) => {
                const flags = parse.flags(flagDefinitions, args, strictFlags);
                const boundArgs = binder(getArgs(args, flags));
                return typeof boundArgs === 'string'
                    ? boundArgs
                    : definition.execute(context, boundArgs, flags);
            }
        };
    }
}

function* buildUsage(tree: CommandTree | ChildCommandTree): IterableIterator<CommandParameter[]> {
    const res = [];
    if ('name' in tree)
        res.push(tree.name);

    for (const inner of buildUsageInner(tree)) {
        inner.unshift(...res);
        yield inner;
    }

    if (tree.handler) {
        res.push(...tree.handler.parameters);
        yield res;
    }


}

function* buildUsageInner(tree: CommandTree): IterableIterator<CommandParameter[]> {
    const yielded = new Set();
    for (const key of Object.keys(tree.switch)) {
        const def = tree.switch[key];
        if (def !== undefined && yielded.size < yielded.add(def).size)
            yield* buildUsage(def);
    }
    for (const test of tree.tests)
        if (yielded.size < yielded.add(test.node).size)
            yield* buildUsage(test.node);
}

function compileArgBinder(prefixes: readonly CommandParameter[], params: readonly CommandParameter[], allowOverflow: boolean): (args: readonly string[]) => readonly unknown[] | string {
    const v_args = 'args';
    const v_params = 'params';
    const v_parsed = 'parsed';
    const v_result = 'result';
    const v_rest = 'rest';
    const v_i = 'i';
    const v_argRaw = `${v_args}[${v_i}]`;
    let m_push = `${v_result}.push(${v_parsed});`;

    const allParams = [...prefixes, ...params];
    const body = [`const ${v_result} = [];`];
    if (allParams.length > 0)
        body.push(`let ${v_i} = 0, ${v_rest}, ${v_parsed};`);
    else if (!allowOverflow)
        body.push(`let ${v_i} = 0;`);

    let i = 0;
    for (; i < allParams.length; i++) {
        const param = allParams[i];
        const isPrefix = i < prefixes.length;
        const m_parse = `${v_params}[${i}].parse(${v_argRaw});`;

        body.push(`// ******** Binding ${param.display} ********`);
        if (param.required) {
            body.push(
                `if (${v_argRaw} === undefined)`,
                `    return \`❌ Invalid arguments! A value for \\\`${param.display}\\\` is required!\`;`,
                `${v_parsed} = ${m_parse}`);
        } else {
            body.push(`${v_parsed} = ${v_argRaw} === undefined ? undefined : ${m_parse}`);
        }
        switch (param.type) {
            case 'literal': {
                if (param.required) {
                    body.push(
                        `if (${v_parsed} === undefined)`,
                        `    return \`❌ Invalid arguments! \\\`\${${v_argRaw}}\\\` is not a valid value for \\\`${param.display}\\\`\`;`,
                        `${v_i}++;`);
                    if (!isPrefix)
                        body.push(m_push);
                } else {
                    if (!isPrefix)
                        body.push(m_push);
                    body.push(
                        `if (${v_parsed} !== undefined)`,
                        `    ${v_i}++`);
                }
                break;
            }
            case 'variable': {
                let indent = '';
                if (param.rest) {
                    indent = '    ';
                    body.pop();
                    body.push(
                        `${v_rest} = [];`,
                        `for (;${v_i} < ${v_args}.length;) {`,
                        `${indent}${v_parsed} = ${v_argRaw} === undefined ? undefined : ${m_parse}`);
                    m_push = `${v_rest}.push(${v_parsed})`;
                }

                if (param.required) {
                    body.push(
                        `${indent}if (${v_parsed} === undefined)`,
                        `${indent}    return \`❌ Invalid arguments! \\\`${param.display}\\\` expects a ${param.valueType} but \\\`\${${v_argRaw}}\\\` is not\`;`);
                } else {
                    body.push(
                        `${indent}if (${v_argRaw} !== undefined && ${v_parsed} === undefined)`,
                        `${indent}    return \`❌ Invalid arguments! \\\`${param.display}\\\` expects a ${param.valueType} but \\\`\${${v_argRaw}}\\\` is not\`;`);
                }

                body.push(
                    `${indent}${m_push}`,
                    `${indent}${v_i}++;`);

                if (param.rest) {
                    body.push(
                        '}',
                        `${v_result}.push(${v_rest});`);
                    m_push = `${v_result}.push(${v_parsed})`;
                }
            }
        }
    }

    if (!allowOverflow) {
        body.push(
            `if (${v_argRaw} !== undefined)`,
            `   return \`❌ Invalid arguments! \${${v_i}} argument\${${v_i} === 1 ? ' is' : 's are'} expected, but you gave \${${v_args}.length}\`;`);
    }

    const src = [
        `(${v_params}) => (${v_args}) => {`,
        ...body.map(l => '    ' + l),
        `    return ${v_result};`,
        '}'
    ];
    return eval(src.join('\n'))(allParams);
}

function* compileParameters(raw: string): Generator<CommandParameter> {
    const regex = /(?<= |^)(?:(?<lname>[\w|]+)(?<lmod>[\?])?|\{(?<vname>\w+)(?<vmod>[\?\+\*])?(?:\:(?<vtype>\w+))?\})(?= |$)/g;
    const rest = ['+', '*'];
    const required = ['+', undefined];
    let match;
    while (match = regex.exec(raw)) {
        if (match.groups?.lname !== undefined) {
            const { lname, lmod } = match.groups;
            const names = lname.split('|');
            const display = names.length > 1 ? `(${names.join('|')})` : names[0];
            const _required = required.includes(lmod);
            const parse = getParser(names);
            yield {
                type: 'literal',
                name: names[0],
                alias: names.slice(1),
                required: _required,
                display: _required ? display : `${display}?`,
                parse: parse
            };
        } else if (match.groups?.vname !== undefined) {
            const { vname, vmod, vtype = 'string' } = match.groups;
            const _required = required.includes(vmod);
            const _rest = rest.includes(vmod);
            const display = `${_rest ? '...' : ''}${vname}`;
            const parse = getParser(vtype);
            yield {
                type: 'variable',
                rest: _rest,
                name: vname,
                required: _required,
                valueType: vtype,
                display: _required ? `<${display}>` : `[${display}]`,
                parse: parse
            };
        }
    }
}

function getParser(types: string | string[]): (value: string) => unknown {
    if (typeof types !== 'string') {
        const choice = new Set(types.map(t => t.toLowerCase()));
        return str => choice.has(str.toLowerCase()) ? str : undefined;
    }

    switch (types) {
        case undefined:
        case 'string': return str => str;
        case 'float':
        case 'number': return str => { const res = parse.float(str); return isNaN(res) ? undefined : res; };
        case 'integer': return str => { const res = parse.int(str); return isNaN(res) ? undefined : res; };
        case 'bool':
        case 'boolean': return str => parse.boolean(str);
        case 'duration': return str => parse.duration(str);
        default: throw new Error(`Invalid type '${types[0]}'`);
    }
}