function float(s) {
    if (typeof s != 'string')
        return parseFloat(s);
    //This replaces all , or . which have a , or . after them with nothing, then the remaining , with .
    return parseFloat(s.replace(/[,\.](?=.*[,\.])/g, '').replace(',', '.'));
}

module.exports = { float }