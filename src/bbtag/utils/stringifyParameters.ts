import { SubtagSignatureParameter } from '../types';

export function stringifyParameters(subtagName: string, parameters: readonly SubtagSignatureParameter[]): string {
    return `{${[subtagName, ...parameters.map(stringifyParameter)].join(';')}}`;
}

function stringifyParameter(parameter: SubtagSignatureParameter): string {
    if ('nested' in parameter) {
        if (parameter.nested.length === 1)
            return stringifyParameter(parameter.nested[0]) + '...';
        return `(${parameter.nested.map(stringifyParameter).join(';')})...`;
    }
    return parameter.required
        ? `<${parameter.name}>`
        : `[${parameter.name}]`;
}
