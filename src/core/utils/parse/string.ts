export function string(value: JToken, includeNull = false): string {
    if (typeof value === 'object') {
        if (value !== null)
            return JSON.stringify(value);
        return includeNull ? 'null' : '';
    } else if (value !== undefined) {
        return value.toString();
    }
    return '';
}
