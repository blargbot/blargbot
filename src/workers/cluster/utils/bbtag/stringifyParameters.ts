import { SubtagHandlerParameter } from '@cluster/types';

export function stringifyParameters(subtagName: string, parameters: readonly SubtagHandlerParameter[]): string {
    return `{${[subtagName, ...parameters.map(stringifyParameter)].join(';')}}`;
}

function stringifyParameter(parameter: SubtagHandlerParameter): string {
    const innerParams = parameter.nested.map(stringifyParameter).join(';');
    let result = innerParams.length > 0 && parameter.name !== undefined ? `${parameter.name} ${innerParams}`
        : parameter.name !== undefined ? parameter.name : innerParams;

    if (parameter.greedy !== false)
        result += '...';

    return parameter.required
        ? `<${result}>`
        : `[${result}]`;
}
