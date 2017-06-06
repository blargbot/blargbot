const { TagVariable } = require('../../Core/Structures');

class TempVariable extends TagVariable {

    async _tagGet(ctx, name) {
        _logger.debug('getting ' + name);
        return ctx.vars[name];
    }

    async _tagSet(ctx, name, value) {
        _logger.debug('setting', name, 'to', value);
        ctx.vars[name] = value;
    }

}

module.exports = TempVariable;