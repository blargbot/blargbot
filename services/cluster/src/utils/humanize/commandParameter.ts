import type { CommandParameter } from '@blargbot/cluster/types.js';

export function commandParameters(parameters: readonly CommandParameter[]): string {
    return parameters.map(commandParameter).join(' ');
}

export function commandParameter(parameter: CommandParameter): string {
    switch (parameter.kind) {
        case 'literal': return parameter.name;
        case 'singleVar':
            if (parameter.required)
                return `<${parameter.name}>`;
            return `[${parameter.name}]`;
        case 'concatVar':
            if (parameter.required)
                return `<${parameter.name}>`;
            return `[${parameter.name}]`;
        case 'greedyVar':
            if (parameter.minLength === 0)
                return `[...${parameter.name}]`;
            return `<...${parameter.name}>`;
    }
}