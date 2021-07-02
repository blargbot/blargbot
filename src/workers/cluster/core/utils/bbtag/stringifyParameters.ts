import { SubtagHandlerParameter } from '../../types';

export function stringifyParameters(subtagName: string, parameters: readonly SubtagHandlerParameter[]): string {
    return `{${[subtagName, ...parameters.map(stringifyParameter)].join(';')}}`;
}

function stringifyParameter(parameter: SubtagHandlerParameter): string {
    const innerParams = parameter.nested.map(stringifyParameter).join(';');
    let result = innerParams && parameter.name ? `${parameter.name} ${innerParams}`
        : parameter.name ? parameter.name : innerParams;

    if (parameter.greedy !== null)
        result += '...';

    return parameter.required
        ? `<${result}>`
        : `[${result}]`;
}