import { BBTagContext } from './BBTagContext';
import { Statement, SubtagArgumentValue as ISubtagArgument, SubtagCall, SubtagHandler, SubtagHandlerArgument, SubtagHandlerCallSignature, SubtagHandlerDefinition, SubtagHandlerDefinitionArgumentGroup, SubtagResult } from './types';

export function parseDefinitions(definitions: readonly SubtagHandlerDefinition[]): readonly SubtagHandlerCallSignature[] {
    return definitions.map(parseDefinition);
}


function parseDefinition(definition: SubtagHandlerDefinition): SubtagHandlerCallSignature {
    return {
        args: definition.args.map(parseArgument),
        description: definition.description,
        execute: definition.execute
    };
}

const argumentGroupMany = ['oneOrMore', 'zeroOrMore'] as ReadonlyArray<string | undefined>;
const argumentRequired = [undefined, 'required', 'oneOrMore'] as ReadonlyArray<string | undefined>;
function parseArgument(argument: string | SubtagHandlerDefinitionArgumentGroup): SubtagHandlerArgument {
    if (typeof argument === 'object') {
        return {
            name: argument.name,
            autoResolve: false,
            many: argumentGroupMany.includes(argument.type),
            required: argumentRequired.includes(argument.type),
            nestedArgs: argument.args.map(parseArgument)
        };
    }

    let autoResolve = true;
    if (argument[0] === '~') {
        autoResolve = false;
        argument = argument.slice(1);
    }

    let required = true;
    let many = false;
    switch (argument[argument.length - 1]) {
        case '?': required = false; break;
        case '*': required = false; many = true; break;
        case '+': many = true; break;
        case '!': break;
        default: argument += '!';
    }
    argument = argument.slice(0, argument.length - 1);

    return {
        name: argument,
        autoResolve,
        required,
        many,
        nestedArgs: []
    };
}



export function compileSignatures(signatures: readonly SubtagHandlerCallSignature[]): SubtagHandler {
    const binding: SubHandlerCollection = { byNumber: {}, byTest: [] };
    let minArgs = Number.MAX_SAFE_INTEGER;
    let maxArgs = 0;

    for (const signature of signatures) {
        const { byTest, byNumber } = createBindings(signature);
        for (const entry of byTest) {
            minArgs = Math.min(minArgs, entry.minArgCount);
            maxArgs = Math.max(maxArgs, entry.maxArgCount);
            binding.byTest.push({ test: entry.test, execute: createSubHandler(signature, entry.binder) });
        }

        for (const argLength of Object.keys(byNumber).map(parseInt)) {
            if (argLength in binding.byNumber)
                throw new Error(`arglength ${argLength} has more than 1 matching pattern!`);
            binding.byNumber[argLength] = createSubHandler(signature, byNumber[argLength]);
            minArgs = Math.min(minArgs, argLength);
            maxArgs = Math.max(maxArgs, argLength);
        }
    }

    return {
        async execute(context, call) {
            const execute = binding.byNumber[call.args.length]
                ?? binding.byTest.find(({ test }) => test(call.args.length))?.execute;

            if (execute !== undefined)
                return await execute(context, call);

            if (call.args.length < minArgs)
                return context.addError('Not enough arguments', call);
            else if (call.args.length > maxArgs)
                return context.addError('Too many arguments', call);
            else
                throw new Error(`Missing handler for ${call.args.length} arguments!`);
        }
    };
}

type SubHandler = (context: BBTagContext, call: SubtagCall) => Promise<SubtagResult>;

interface SubHandlerCollection {
    byNumber: { [argLength: number]: SubHandler };
    byTest: Array<{ execute: SubHandler, test: (argCount: number) => boolean }>;
}

type ArgumentBinder = (context: BBTagContext, call: SubtagCall) => Promise<readonly ISubtagArgument[]>;

interface ArgumentBindings {
    byNumber: { [argLength: number]: ArgumentBinder };
    byTest: Array<{ binder: ArgumentBinder, test: (argCount: number) => boolean, minArgCount: number, maxArgCount: number, }>;
}

function createSubHandler(signature: SubtagHandlerCallSignature, binder: ArgumentBinder): SubHandler {
    return async (context, call) => await signature.execute(context, await binder(context, call), call);
}

function createBindings(signature: SubtagHandlerCallSignature): ArgumentBindings {
    const argPatterns = [...permuteArguments(0, signature.args)];

    return {
        byNumber: argPatterns.reduce((g, args) => {
            if (args.length in g)
                throw new Error(`arglength ${args.length} has more than 1 matching pattern!`);
            g[args.length] = createBinding(args.reverse());
            return g;
        }, <ArgumentBindings['byNumber']>{}),
        byTest: [] // TODO Need to work out the tests for greedy arguments
    };
}

function createBinding(args: SubtagHandlerArgument[]): ArgumentBinder {
    if (args.length == 0)
        return () => Promise.resolve([]);

    return async (context, call) => {
        const result: ISubtagArgument[] = [];

        for (let i = 0; i < args.length; i++) {
            const arg = new SubtagArgument(context, call.args[i]);
            if (args[i].autoResolve)
                await arg.wait();
            result.push(arg);
        }

        return result;
    };
}

function* permuteArguments(index: number, args: readonly SubtagHandlerArgument[]): IterableIterator<SubtagHandlerArgument[]> {
    if (index >= args.length) {
        yield [];
        return;
    }

    const arg = args[index];

    if (!arg.required)
        yield* permuteArguments(index + 1, args);

    if (arg.many)
        return;

    if (arg.nestedArgs.length == 0) {
        for (const entry of permuteArguments(index + 1, args)) {
            entry.push(arg);
            yield entry;
        }
    } else {
        for (const partial of permuteArguments(0, arg.nestedArgs)) {
            for (const entry of permuteArguments(index + 1, args)) {
                entry.push(...partial);
                yield entry;
            }
        }
    }
}

class SubtagArgument implements ISubtagArgument {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #promise?: Promise<string>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #value?: string;

    public readonly code: Statement;
    public get isCached(): boolean { return this.#value === undefined; }
    public get raw(): string { throw new Error('Not implemented yet'); }
    public get value(): string {
        if (this.#value === undefined)
            throw new Error('The value is not available yet. Please await the wait() method before attempting to access the value');
        return this.#value;
    }

    public constructor(private readonly context: BBTagContext, code: Statement) {
        this.code = code;
    }
    public async execute(): Promise<string> {
        const result = await this.context.eval(this.code);
        this.#value = result;
        return result;
    }

    public wait(): Promise<string> {
        return this.#promise ??= this.execute();
    }
}