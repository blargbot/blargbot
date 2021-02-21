import { humanize, parse } from '../../utils';
import { CommandDefinition, CompiledCommand, CommandTreeNode, ChildCommandHandlerTreeNode, CommandParameter } from './types';

export function compileCommand(definition: CommandDefinition): CompiledCommand {
    const tree = populateTree(definition, { switch: {}, tests: [] }, 0);
    return {
        structure: tree,
        usage: [...buildUsage(tree)],
        execute: (message, flagDefinitions, args, raw) => {
            let node = tree;
            const flags = parse.flags(flagDefinitions, args);
            for (const arg of flags.undefined) {
                const switched = node.switch[arg.toLowerCase()];
                if (switched) {
                    node = switched;
                    continue;
                }
                for (const test of node.tests) {
                    if (test.check(arg)) {
                        node = test.node;
                        continue;
                    }
                }
                if (node.handler)
                    return node.handler.execute(message, flags, raw);

                const expected = [...buildUsage(node)].map(u => `\`${u[0].display}\``);
                return `❌ Invalid arguments! Expected ${humanize.smartJoin(expected, ', ', ' or ')} but got \`${arg}\``;

            }

            if (node.handler)
                return node.handler.execute(message, flags, raw);

            const expected = [...buildUsage(node)].map(u => `\`${u[0].display}\``);
            return `❌ Not enough arguments! Expected ${humanize.smartJoin(expected, ', ', ' or ')}`;
        }
    };
}

function populateTree(definition: CommandDefinition, tree: CommandTreeNode, depth: number): CommandTreeNode {
    if ('subcommands' in definition) {
        for (const key of Object.keys(definition.subcommands)) {
            const subDefinition = definition.subcommands[key];
            let _node = tree;
            let _depth = depth;
            for (const parameter of compileParameters(key)) {
                _depth++;
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
                        const nextNode: ChildCommandHandlerTreeNode = { switch: {}, tests: [], name: parameter };
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
            populateTree(subDefinition, _node, _depth);
        }
    }

    if ('execute' in definition) {
        if (tree.handler !== undefined)
            throw new Error('Duplicate handler found!');
        const parameters = [...compileParameters(definition.parameters)];
        const restParams = parameters.filter(p => p.type === 'variable' && p.rest);
        if (restParams.length > 1)
            throw new Error(`Cannot have more than 1 rest parameter, but found ${restParams.map(p => p.name).join(',')}`);
        if (restParams.length === 1 && parameters[parameters.length - 1] !== restParams[0])
            throw new Error('Rest parameters must be the last parameter of a command');
        const binder = compileArgBinder(parameters, depth);
        tree.handler = {
            parameters,
            execute: (message, flags, raw) => {
                const boundArgs = binder(flags.undefined);
                return typeof boundArgs === 'string'
                    ? boundArgs
                    : definition.execute(message, boundArgs, flags, raw);
            }
        };
    }

    return tree;
}

function* buildUsage(tree: CommandTreeNode | ChildCommandHandlerTreeNode): IterableIterator<CommandParameter[]> {
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

function* buildUsageInner(tree: CommandTreeNode): IterableIterator<CommandParameter[]> {
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

function compileArgBinder(params: CommandParameter[], skipCount: number): (args: string[]) => unknown[] | string {
    const body = [
        'const variables = [];',
        `let i = ${skipCount}, arg, argRaw;`
    ];

    let i = 0;
    for (; i < params.length; i++) {
        const param = params[i];
        body.push('argRaw = args[i];');
        body.push(`arg = argRaw === undefined ? undefined : parameters[${i}].parse(argRaw);`);
        if (param.required)
            body.push(`if (argRaw === undefined) return \`❌ Invalid arguments! A value for \\\`${param.name}\\\` is required!\`;`);
        switch (param.type) {
            case 'literal': {
                if (param.required) {
                    body.push(`if (arg === undefined) return \`❌ Invalid arguments! \\\`\${argRaw}\\\` is not a valid value for \\\`${param.name}\\\`\`;`);
                    body.push('variables.push(arg);');
                    body.push('i++;');
                } else {
                    body.push('variables.push(arg);');
                    body.push('if (arg !== undefined) i++');
                }
                break;
            }
            case 'variable': {
                let indent = '';
                if (param.rest) {
                    body.push('for (;i < args.length;) {');
                    body.push('    argRaw = args[i];');
                    body.push(`    arg = argRaw === undefined ? undefined : parameters[${i}].parse(argRaw);`);
                    indent = '    ';
                }

                if (param.required) {
                    body.push(`${indent}if (arg === undefined) return \`❌ Invalid arguments! \\\`${param.name}\\\` expects a ${param.valueType} but \\\`\${argRaw}\\\` is not\`;`);
                } else {
                    body.push(`${indent}if (argRaw !== undefined && arg === undefined) return \`❌ Invalid arguments! \\\`${param.name}\\\` expects a ${param.valueType} but \\\`\${argRaw}\\\` is not\`;`);
                }

                body.push(`${indent}variables.push(arg)`);
                body.push(`${indent}i++;`);

                if (param.rest)
                    body.push('}');
            }
        }
    }

    const src = [
        '(parameters) => (args) => {',
        ...body.map(l => '    ' + l),
        '    return variables;',
        '}'
    ];
    return eval(src.join('\n'))(params);
}

function* compileParameters(raw: string): IterableIterator<CommandParameter> {
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