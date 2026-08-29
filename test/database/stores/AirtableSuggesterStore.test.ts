import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';

import { AirtableSuggesterStore } from '@blargbot/database/stores/AirtableSuggesterStore.js';
import type { Suggester } from '@blargbot/domain/models/index.js';
import type { Logger } from '@blargbot/logger';
import { argument, Mock } from '@blargbot/test-util/mock.js';
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
            const airtable = new Mock<{ getTable: AirtableBase; }>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const record = new Mock<Record<Fields>>();
            const logger = new Mock<Logger>(undefined, false);
            const store = new AirtableSuggesterStore(airtable.instance.getTable, logger.instance);
            const userId = randomUUID();
            const expected: Fields = {
                ID: userId,
                Username: 'Some user'
            };

            airtable.setup(m => m.getTable<Fields>('Suggestors')).thenReturn(suggestorsTable.instance);
            suggestorsTable.setup(m => m.find(userId)).thenResolve(record.instance);
            record.setup(m => m.fields).thenReturn(expected);

            // act
            const result = await store.get(userId);

            // assert
            assert.equal(result, expected);
        });
        await it('should return undefined when it doesnt exists', async () => {
            // arrange
            const airtable = new Mock<{ getTable: AirtableBase; }>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const logger = new Mock<Logger>(undefined, false);
            const store = new AirtableSuggesterStore(airtable.instance.getTable, logger.instance);
            const userId = randomUUID();

            airtable.setup(m => m.getTable<Fields>('Suggestors')).thenReturn(suggestorsTable.instance);
            suggestorsTable.setup(m => m.find(userId)).thenReject(notFoundError);

            // act
            const result = await store.get(userId);

            // assert
            assert.equal(result, undefined);
        });
    });
    await describe('#upsert', async () => {
        await it('Should create the user if it doesnt exist', async () => {
            // arrange
            const airtable = new Mock<{ getTable: AirtableBase; }>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const query = new Mock<Query<Fields>>();
            const record = new Mock<Record<Fields>>();
            const logger = new Mock<Logger>(undefined, false);
            const store = new AirtableSuggesterStore(airtable.instance.getTable, logger.instance);
            const userId = randomUUID();
            const username = randomUUID();
            const expected = randomUUID();

            airtable.setup(m => m.getTable<Fields>('Suggestors')).thenReturn(suggestorsTable.instance);
            suggestorsTable.setup(m => m.select(argument.isDeepEqual({ maxRecords: 1, filterByFormula: `{ID} = '${userId}'` }))).thenReturn(query.instance);
            query.setup(m => m.firstPage()).thenResolve([]);
            suggestorsTable.setup(m => m.create(
                argument.isDeepEqual({ ID: userId, Username: username }),
                argument.isDeepEqual({ typecast: true })
            )).thenResolve(record.instance);
            record.setup(m => m.id).thenReturn(expected);

            // act
            const result = await store.upsert(userId, username);

            // assert
            assert.equal(result, expected);
        });
        await it('Should return undefined if the create fails', async () => {
            // arrange
            const airtable = new Mock<{ getTable: AirtableBase; }>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const query = new Mock<Query<Fields>>();
            const logger = new Mock<Logger>(undefined, false);
            const store = new AirtableSuggesterStore(airtable.instance.getTable, logger.instance);
            const userId = randomUUID();
            const username = randomUUID();

            airtable.setup(m => m.getTable<Fields>('Suggestors')).thenReturn(suggestorsTable.instance);
            suggestorsTable.setup(m => m.select(argument.isDeepEqual({ maxRecords: 1, filterByFormula: `{ID} = '${userId}'` }))).thenReturn(query.instance);
            query.setup(m => m.firstPage()).thenResolve([]);
            suggestorsTable.setup(m => m.create(
                argument.isDeepEqual({ ID: userId, Username: username }),
                argument.isDeepEqual({ typecast: true })
            )).thenReject(notFoundError);

            // act
            const result = await store.upsert(userId, username);

            // assert
            assert.equal(result, undefined);
        });
        await it('Should update the user if it does exist', async () => {
            // arrange
            const airtable = new Mock<{ getTable: AirtableBase; }>();
            const suggestorsTable = new Mock<Table<Fields>>();
            const query = new Mock<Query<Fields>>();
            const record = new Mock<Record<Fields>>();
            const logger = new Mock<Logger>(undefined, false);
            const store = new AirtableSuggesterStore(airtable.instance.getTable, logger.instance);
            const userId = randomUUID();
            const username = randomUUID();
            const expected = randomUUID();

            airtable.setup(m => m.getTable<Fields>('Suggestors')).thenReturn(suggestorsTable.instance);
            suggestorsTable.setup(m => m.select(argument.isDeepEqual({ maxRecords: 1, filterByFormula: `{ID} = '${userId}'` }))).thenReturn(query.instance);
            query.setup(m => m.firstPage()).thenResolve([record.instance]);
            record.setup(m => m.id).thenReturn(expected);
            suggestorsTable.setup(m => m.update(
                expected,
                argument.isDeepEqual({ Username: username })
            )).thenResolve(record.instance);

            // act
            const result = await store.upsert(userId, username);

            // assert
            assert.equal(result, expected);
        });
    });
});
