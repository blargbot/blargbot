export function getSortOrder(type: CommandVariableType): number {
    return typeOrder.indexOf(type);
}

export function isCommandVariableType(type: string): type is CommandVariableType {
    return supportedTypes.has(type);
}

export type CommandVariableType = typeof typeOrder[number];

const typeOrder = [
    'duration',
    'integer',
    'number',
    'boolean',
    'string'
] as const;

const supportedTypes = new Set<string>(typeOrder);
