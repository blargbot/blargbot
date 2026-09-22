import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';

import { AirtableSuggesterStore } from '@blargbot/database';
import type { Suggester } from '@blargbot/domain';
import type { Logger } from '@blargbot/logger';
import { Mock as Mock } from '@blargbot/test-util/mock.js';
import type { AirtableBase } from 'airtable/lib/airtable_base.js';
import AirtableError from 'airtable/lib/airtable_error.js';
import type { FieldSet } from 'airtable/lib/field_set.js';
import type Query from 'airtable/lib/query.js';
import type Record from 'airtable/lib/record.js';
import type Table from 'airtable/lib/table.js';

type Fields = Suggester & FieldSet;
const notFoundError = new AirtableError('Not found', 'Not found', 404) as unknown as Error;
await describe('AirtableSuggesterStore', async () => {
    await describe('#get', async () => {
        await it('should return a suggester when it exists', async () => {
            // arrange
            const airtable = new Mock<AirtableBase>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const record = new Mock<Record<Fields>>();
            const logger = new Mock<Logger>({ typeof: 'object', loose: true });
            const store = new AirtableSuggesterStore(airtable.instance, logger.instance);
            const userId = randomUUID();
            const expected: Fields = {
                ID: userId,
                Username: 'Some user'
            };

            airtable.setup(m => m<Fields>('Suggestors')).returns(suggestorsTable.instance);
            suggestorsTable.setup(m => m.find(userId)).resolves(record.instance);
            record.setup(m => m.fields).returns(expected);

            // act
            const result = await store.get(userId);

            // assert
            assert.equal(result, expected);
        });
        await it('should return undefined when it doesnt exists', async () => {
            // arrange
            const airtable = new Mock<AirtableBase>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const logger = new Mock<Logger>({ typeof: 'object', loose: true });
            const store = new AirtableSuggesterStore(airtable.instance, logger.instance);
            const userId = randomUUID();

            airtable.setup(m => m<Fields>('Suggestors')).returns(suggestorsTable.instance);
            suggestorsTable.setup(m => m.find(userId)).rejects(notFoundError);

            // act
            const result = await store.get(userId);

            // assert
            assert.equal(result, undefined);
        });
    });
    await describe('#upsert', async () => {
        await it('Should create the user if it doesnt exist', async () => {
            // arrange
            const airtable = new Mock<AirtableBase>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const record = new Mock<Record<Fields>>();
            const query = new Mock<Query<Fields>>();
            const logger = new Mock<Logger>({ typeof: 'object', loose: true });
            const store = new AirtableSuggesterStore(airtable.instance, logger.instance);
            const userId = randomUUID();
            const username = randomUUID();
            const expected = randomUUID();

            airtable.setup(m => m<Fields>('Suggestors')).returns(suggestorsTable.instance).mustHappen();
            suggestorsTable.setup((m, $) => m.select($.looksLike({ maxRecords: 1, filterByFormula: `{ID} = '${userId}'` }))).returns(query.instance);
            query.setup(m => m.firstPage()).resolves([]);
            suggestorsTable.setup((m, $) => m.create(
                $.looksLike({ ID: userId, Username: username }),
                $.looksLike({ typecast: true })
            )).resolves(record.instance);
            record.setup(m => m.id).returns(expected);

            // act
            const result = await store.upsert(userId, username);

            // assert
            assert.equal(result, expected);
        });
        await it('Should return undefined if the create fails', async () => {
            // arrange
            const airtable = new Mock<AirtableBase>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const query = new Mock<Query<Fields>>();
            const logger = new Mock<Logger>({ typeof: 'object', loose: true });
            const store = new AirtableSuggesterStore(airtable.instance, logger.instance);
            const userId = randomUUID();
            const username = randomUUID();

            airtable.setup(m => m<Fields>('Suggestors')).returns(suggestorsTable.instance);
            suggestorsTable.setup((m, $) => m.select($.looksLike({ maxRecords: 1, filterByFormula: `{ID} = '${userId}'` }))).returns(query.instance);
            query.setup(m => m.firstPage()).resolves([]);
            suggestorsTable.setup((m, $) => m.create(
                $.looksLike({ ID: userId, Username: username }),
                $.looksLike({ typecast: true })
            )).rejects(notFoundError);

            // act
            const result = await store.upsert(userId, username);

            // assert
            assert.equal(result, undefined);
        });
        await it('Should update the user if it does exist', async () => {
            // arrange
            const airtable = new Mock<AirtableBase>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const record = new Mock<Record<Fields>>();
            const query = new Mock<Query<Fields>>();
            const logger = new Mock<Logger>({ typeof: 'object', loose: true });
            const store = new AirtableSuggesterStore(airtable.instance, logger.instance);
            const userId = randomUUID();
            const username = randomUUID();
            const expected = randomUUID();

            airtable.setup(m => m<Fields>('Suggestors')).returns(suggestorsTable.instance);
            suggestorsTable.setup((m, $) => m.select($.looksLike({ maxRecords: 1, filterByFormula: `{ID} = '${userId}'` }))).returns(query.instance);
            query.setup(m => m.firstPage()).resolves([record.instance]);
            record.setup(m => m.id).returns(expected);
            suggestorsTable.setup((m, $) => m.update(
                expected,
                $.looksLike({ Username: username })
            )).resolves(record.instance);

            // act
            const result = await store.upsert(userId, username);

            // assert
            assert.equal(result, expected);
        });
    });
});
