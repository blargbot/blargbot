const { TagVariable } = require('../../Core/Structures');

class SharedVariable extends TagVariable {

    /**
     * NO OP
     * Still must decide how to implement
     */

    get prefix() {
        return '&';
    }

}

module.exports = SharedVariable;