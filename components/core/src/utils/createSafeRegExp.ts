import { createUserRegExpParser } from '@blargbot/user-regex';

export const createSafeRegExp = createUserRegExpParser(2000);
