const Tag = require('../structure/Tag');

class AbsTag extends Tag {
    constructor() {
        super({
            name: 'abs',
            args: [{
                name: 'number'
            }],
            desc: 'Gets the absolute value of a number',
            exampleIn: '{abs;-535}',
            exampleOut: '535'
        });
    }

    async execute(params) {
        let result = super.execute(params);
        if (params.args[1]) {
            var asNumber = parseFloat(params.args[1]);
            if (!isNaN(asNumber)) {
                result.replaceString = Math.abs(asNumber);
            } else {
                result.replaceString = await this.processError(params, '`Not a number`');
            }
        } else {
            result.replaceString = await this.processError(params, '`Not enough arguments`');
        }
        return result;
    }
}

module.exports = AbsTag;