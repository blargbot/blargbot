function boolean(value, defValue = null, includeNumbers = true) {
    if (typeof value == 'boolean')
        return value;

    if (includeNumbers && typeof value == 'number')
        return value !== 0;

    if (typeof value != 'string')
        return defValue;

    if (includeNumbers) {
        let asNum = parseFloat(value);
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

module.exports = { boolean };