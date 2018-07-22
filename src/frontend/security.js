const jwt = require('jsonwebtoken');
const config = require('../../config.json');
const secret = config.auth.secret;
let expiry = (60 * 60 * 24 * 2); // 48 hours

class Security {
    static generatedToken(id) {
        const token = jwt.sign({ id, exp: Math.floor(Date.now() / 1000) + expiry }, secret);
        return token;
    }

    static validateToken(token) {
        try {
            const id = jwt.verify(token, secret);
            return id;
        } catch (err) {
            return null;
        }
    }

    static set expiry(value) {
        expiry = value;
    }
}

module.exports = Security;