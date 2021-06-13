import { SubtagHandlerArgument } from '../../core/bbtag';

export function stringifyArguments(subtagName: string, args: readonly SubtagHandlerArgument[]): string {
    return `{${[subtagName, ...args.map(stringifyArgument)].join(';')}}`;
}

function stringifyArgument(arg: SubtagHandlerArgument): string {
    const innerArgs = arg.nestedArgs.map(stringifyArgument).join(';');
    let result = innerArgs && arg.name ? `${arg.name} ${innerArgs}`
        : arg.name ? arg.name : innerArgs;

    if (arg.greedy !== null)
        result += '...';

    return arg.required
        ? `<${result}>`
        : `[${result}]`;
}