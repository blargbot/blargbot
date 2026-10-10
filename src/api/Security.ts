import { config } from '@blargbot/config';
import jsonwebtoken from 'jsonwebtoken';

export default class Security {
    public static generateToken(id: string): string {
        const currentDate = Math.floor(Date.now() / 1000);
        const expiry = config.website.sessionExpiry;
        const payload = {
            id, exp: + currentDate + expiry
        };

        const token = jsonwebtoken.sign(payload, config.website.sessionSecret);

        return token;
    }

    public static validateToken(token: string): string | null {
        try {
            const payload = jsonwebtoken.verify(token, config.website.sessionSecret);
            if (typeof payload === 'string')
                return payload;
            return payload.id as string;
        } catch {
            return null;
        }
    }
}
