import { parse } from '../../utils';
import { CommandHandler, CommandHandlerTree } from './types';

interface CompiledHandlerTree<T> {
    name: string;
    execute: CommandHandler<T>;
    children: Array<CompiledHandlerChild<T>>;
}
interface CompiledHandlerChild<T> extends CompiledHandlerTree<T> {
    check: (arg: string) => boolean;
    greedy: boolean;
}

export function compileHandlerTree<T>(tree: CommandHandlerTree<T>, name: string): (args: string[]) => CommandHandler<T> {
    const compiled = compileTree(tree, name);
    return args => traverse(compiled, args, 1);
}

function traverse<T>(tree: CompiledHandlerTree<T>, args: string[], index: number): CommandHandler<T> {
    if (args.length === index)
        return tree.execute;

    if (tree.children.length === 0)
        return () => `❌ Didnt expect any parameters after \`<${tree.name}>\` ('${args[index]}')`;

    for (const child of tree.children) {
        if (!child.greedy) {
            if (child.check(args[index])) {
                return traverse(child, args, index + 1);
            }
        } else {
            for (; index < args.length; index++) {
                if (!child.check(args[index]))
                    return () => `❌ ${args[index]} is not a valid value for ${smartJoinNames([child])}`;
            }
            return child.execute;
        }
    }

    return () => `❌ ${args[index]} is not a valid value for ${smartJoinNames(tree.children)}`;
}

function compileTree<T>(tree: CommandHandlerTree<T>, name: string): CompiledHandlerTree<T> {
    const children: CompiledHandlerChild<T>[] = [];

    for (const key in tree) {
        if (key.startsWith('_'))
            continue;
        const subRaw = tree[key];
        if (subRaw === undefined)
            continue;
        const sub: CommandHandlerTree<T> = typeof subRaw === 'function' ? { _run: subRaw } : subRaw;
        const keyDetails = compileKey(key);
        const child = {
            ...keyDetails,
            ...compileTree(sub, keyDetails.name)
        };
        if (child.greedy && child.children.length > 0)
            throw new Error('Greedy arguments cannot have children');
        if (child.execute === undefined && child.children.length === 0)
            throw new Error('Cannot have a subcommand with no handler or children');
        children.push(child);
    }

    return {
        name,
        execute: tree._run ?? (() => `❌ You must provide an argument for ${smartJoinNames(children)}`),
        children: children
    };
}

function smartJoinNames(items: Array<{ name: string }>): string {
    const namesArr = items.map(c => `\`<${c.name}>\``);
    return namesArr.length > 1
        ? namesArr.slice(0, -1).join(', ') + ' or ' + namesArr[namesArr.length - 1]
        : namesArr[0] ?? '';
}

function compileKey(key: string): { greedy: boolean, check: (arg: string) => boolean, name: string } {
    let match = /^\{(\.{1,})?(.+?)(?:\:(\w+))?\}$/.exec(key);
    if (match) {
        const greedy = match[1] !== undefined;
        const check = match[2];
        const name = match[3];
        if (check.startsWith('/') && check.endsWith('/')) { // key = '{.../regex/:name}'
            const regex = new RegExp(`/^${check.slice(1, -1)}$/`, 'i');
            return { greedy, check: str => regex.test(str), name: name ?? 'arg' };
        }

        // key = '{...name:type}'
        const typeCheck = getTypeCheck(name ?? 'string');
        return { greedy, check: typeCheck, name: check };
    }
    match = /^\((\.{1,})?\|(.+?)\)$/.exec(key);
    if (match) { // key = '(...|op1|op2|op3)'
        const greedy = match[1] !== undefined;
        const options = new Set(match[2].split('|').map(op => op.trim()));
        return { greedy, check: str => options.has(str), name: match[1] };
    }
    match = /^(?:\.{1,})(.+?)$/.exec(key);
    if (match) { // key = '...name'
        const check = match[1].trim();
        return { greedy: true, check: str => str.trim() === check, name: check };
    }
    // key = 'name'
    key = key.trim();
    return { greedy: false, check: str => str.trim() === key, name: key };
}

function getTypeCheck(type: string): (arg: string) => boolean {
    switch (type) {
        case 'string': return () => true;
        case 'number': return str => !Number.isNaN(parse.float(str));
        case 'boolean': return str => typeof parse.boolean(str) === 'boolean';
        default: throw new Error(`Unknown type ${type}`);
    }
}