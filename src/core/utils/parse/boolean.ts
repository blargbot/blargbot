export function boolean(value: string | boolean | number | undefined, defValue: boolean, includeNumbers?: boolean): boolean
export function boolean(value: string | boolean | number | undefined, defValue?: undefined, includeNumbers?: boolean): boolean | undefined
export function boolean(value: string | boolean | number | undefined, defValue?: boolean, includeNumbers = true): boolean | undefined {
    if (typeof value === 'boolean')
        return value;

    if (includeNumbers && typeof value === 'number')
        return value !== 0;

    if (typeof value !== 'string')
        return defValue;

    if (includeNumbers) {
        const asNum = parseFloat(value);
        if (!isNaN(asNum))
            return asNum !== 0;
    }

    switch (value.toLowerCase()) {
        case 'true':
        case 't':
        case 'yes':
        case 'y':
            return true;
        case 'false':
        case 'f':
        case 'no':
        case 'n':
            return false;
        default:
            return defValue;
    }
}
