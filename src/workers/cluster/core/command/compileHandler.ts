import { humanize } from '../globalCore';
import { CommandDefinition, CommandHandler, CommandParameter, CommandSignatureHandler, FlagDefinition, FlagResult } from '../types';
import { parse } from '../utils';
import { CommandContext } from './CommandContext';

export function compileHandler<TContext extends CommandContext>(definition: CommandDefinition<TContext>, flagDefinitions: readonly FlagDefinition[]): CommandHandler<TContext> {
    const tree = buildTree(definition, flagDefinitions);
    return {
        signatures: [...buildUsage(tree)],
        execute: (context) => {
            let node = tree;
            args: for (const arg of context.args) {
                // TODO improve traversal here
                const switched = node.switch[arg.toLowerCase()];
                if (switched !== undefined) {
                    node = switched;
                    continue args;
                }
                for (const test of node.tests) {
                    if (test.check(arg)) {
                        node = test.node;
                        continue args;
                    }
                }
                if (node.handler !== undefined)
                    return node.handler.execute(context, context.args);

                const expected = [...buildUsage(node)].map(u => `\`${u[0].display}\``);
                return `❌ Invalid arguments! Expected ${humanize.smartJoin(expected, ', ', ' or ')} but got \`${arg}\``;

            }

            if (node.handler !== undefined)
                return node.handler.execute(context, context.args);

            const expected = [...buildUsage(node)].map(u => `\`${u[0].display}\``);
            return `❌ Not enough arguments! Expected ${humanize.smartJoin(expected, ', ', ' or ')}`;
        }
    };
}

function buildTree<TContext extends CommandContext>(
    definition: CommandDefinition<TContext>,
    flagDefinitions: readonly FlagDefinition[]
): CommandTree<TContext> {
    const tree: CommandTree<TContext> = { switch: {}, tests: [] };
    populateTree(definition, flagDefinitions, tree, []);
    return tree;
}

function populateTree<TContext extends CommandContext>(
    definition: CommandDefinition<TContext>,
    flagDefinitions: readonly FlagDefinition[],
    tree: CommandTree<TContext>,
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
                        const nextNode: ChildCommandTree<TContext> = { switch: {}, tests: [], name: parameter };
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

        const getArgs = definition.useFlags ?? flagDefinitions.length > 0
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

function* buildUsage<TContext extends CommandContext>(tree: CommandTree<TContext> | ChildCommandTree<TContext>): IterableIterator<CommandParameter[]> {
    const res = [];
    if ('name' in tree)
        res.push(tree.name);

    for (const inner of buildUsageInner(tree)) {
        inner.unshift(...res);
        yield inner;
    }

    if (tree.handler !== undefined) {
        res.push(...tree.handler.parameters);
        yield res;
    }

}

function* buildUsageInner<TContext extends CommandContext>(tree: CommandTree<TContext>): IterableIterator<CommandParameter[]> {
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
    const argsName = 'args';
    const paramsName = 'params';
    const parsedName = 'parsed';
    const resultName = 'result';
    const restName = 'rest';
    const indexName = 'i';
    const argRawName = `${argsName}[${indexName}]`;
    let callPushResult = `${resultName}.push(${parsedName});`;

    const allParams = [...prefixes, ...params];
    const body = [`const ${resultName} = [];`];
    if (allParams.length > 0)
        body.push(`let ${indexName} = 0, ${restName}, ${parsedName};`);
    else if (!allowOverflow)
        body.push(`let ${indexName} = 0;`);

    let i = 0;
    for (; i < allParams.length; i++) {
        const param = allParams[i];
        const isPrefix = i < prefixes.length;
        const callParse = `${paramsName}[${i}].parse(${argRawName});`;

        body.push(`// ******** Binding ${param.display} ********`);
        if (param.required) {
            body.push(
                `if (${argRawName} === undefined)`,
                `    return \`❌ Invalid arguments! A value for \\\`${param.display}\\\` is required!\`;`,
                `${parsedName} = ${callParse}`);
        } else {
            body.push(`${parsedName} = ${argRawName} === undefined ? undefined : ${callParse}`);
        }
        switch (param.type) {
            case 'literal': {
                if (param.required) {
                    body.push(
                        `if (${parsedName} === undefined)`,
                        `    return \`❌ Invalid arguments! \\\`\${${argRawName}}\\\` is not a valid value for \\\`${param.display}\\\`\`;`,
                        `${indexName}++;`);
                    if (!isPrefix)
                        body.push(callPushResult);
                } else {
                    if (!isPrefix)
                        body.push(callPushResult);
                    body.push(
                        `if (${parsedName} !== undefined)`,
                        `    ${indexName}++`);
                }
                break;
            }
            case 'variable': {
                let indent = '';
                if (param.rest) {
                    indent = '    ';
                    body.pop();
                    body.push(
                        `${restName} = [];`,
                        `for (;${indexName} < ${argsName}.length;) {`,
                        `${indent}${parsedName} = ${argRawName} === undefined ? undefined : ${callParse}`);
                    callPushResult = `${restName}.push(${parsedName})`;
                }

                if (param.required) {
                    body.push(
                        `${indent}if (${parsedName} === undefined)`,
                        `${indent}    return \`❌ Invalid arguments! \\\`${param.display}\\\` expects a ${param.valueType} but \\\`\${${argRawName}}\\\` is not\`;`);
                } else {
                    body.push(
                        `${indent}if (${argRawName} !== undefined && ${parsedName} === undefined)`,
                        `${indent}    return \`❌ Invalid arguments! \\\`${param.display}\\\` expects a ${param.valueType} but \\\`\${${argRawName}}\\\` is not\`;`);
                }

                body.push(
                    `${indent}${callPushResult}`,
                    `${indent}${indexName}++;`);

                if (param.rest) {
                    body.push(
                        '}',
                        `${resultName}.push(${restName});`);
                    callPushResult = `${resultName}.push(${parsedName})`;
                }
            }
        }
    }

    if (!allowOverflow) {
        body.push(
            `if (${argRawName} !== undefined)`,
            `   return \`❌ Invalid arguments! \${${indexName}} argument\${${indexName} === 1 ? ' is' : 's are'} expected, but you gave \${${argsName}.length}\`;`);
    }

    const src = [
        `(${paramsName}) => (${argsName}) => {`,
        ...body.map(l => '    ' + l),
        `    return ${resultName};`,
        '}'
    ];
    const builder = eval(src.join('\n')) as (parameters: CommandParameter[]) => (args: readonly string[]) => readonly unknown[] | string;
    return builder(allParams);
}

function* compileParameters(raw: string): Generator<CommandParameter> {
    const regex = /(?<= |^)(?:(?<lname>[\w|]+)(?<lmod>[?])?|\{(?<vname>\w+)(?<vmod>[?+*])?(?::(?<vtype>\w+))?\})(?= |$)/g;
    const rest = ['+', '*'];
    const required = ['+', undefined];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(raw)) !== null) {
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
        case 'number': return str => {
            const res = parse.float(str);
            return isNaN(res) ? undefined : res;
        };
        case 'integer': return str => {
            const res = parse.int(str);
            return isNaN(res) ? undefined : res;
        };
        case 'bool':
        case 'boolean': return str => parse.boolean(str);
        case 'duration': return str => parse.duration(str);
        default: throw new Error(`Invalid type '${types[0]}'`);
    }
}

interface ChildCommandTree<TContext extends CommandContext> extends CommandTree<TContext> {
    readonly name: CommandParameter;
}

interface CommandTree<TContext extends CommandContext> {
    readonly switch: { [key: string]: ChildCommandTree<TContext> | undefined; };
    readonly tests: Array<VariableCommandTree<TContext>>;
    handler?: CommandSignatureHandler<TContext>;
}

interface VariableCommandTree<TContext extends CommandContext> {
    readonly check: (arg: string) => boolean;
    readonly node: ChildCommandTree<TContext>;
}
