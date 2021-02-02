function int(s, radix = 10) {
    if (typeof s != 'string')
        return parseInt(s, radix);
    //This replaces all , or . which have a , or . after them with nothing, then the remaining , with .
    return parseInt(s.replace(/[,\.](?=.*[,\.])/g, '').replace(',', '.'), radix);
}

module.exports = { int }