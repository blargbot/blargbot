const { General } = require('../../../Core/Tag/Classes');

class VoidTag extends General {
    constructor(client) {
        super(client, {
            name: 'void',
            args: [
                {
                    name: 'code',
                    optional: true,
                    repeat: true
                }
            ]
        });
    }
}

module.exports = VoidTag;