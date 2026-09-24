import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Mock } from './mock.js';

await describe('mock', async () => {
    await it('Should be able to mock a direct invocation ignoring `this`.', () => {
        // arrange
        const sut = new Mock<(id: string) => string>({ typeof: 'function' });

        // act
        sut.setup(x => x('123')).returns('success!');
        const instance = sut.instance;

        // assert
        assert.equal(instance('123'), 'success!');
        assert.equal(sut.instance('123'), 'success!');
        assert.equal(instance.call(new Date(), '123'), 'success!');
        assert.equal(instance.apply(new Date(), ['123']), 'success!');
        assert.throws(() => instance('456'));
        assert.throws(() => instance.name);
    });
    await it('Should be able to mock an indirect invocation respecting `this` via .call', () => {
        // arrange
        const sut = new Mock<(id: string) => string>({ typeof: 'function' });

        // act
        sut.setup(x => x.call(undefined, '123')).returns('success!');
        const instance = sut.instance;

        // assert
        assert.equal(instance('123'), 'success!');
        assert.throws(() => sut.instance('123'));
        assert.throws(() => instance.call(new Date(), '123'));
        assert.throws(() => instance.apply(new Date(), ['123']));
        assert.throws(() => instance('456'));
        assert.throws(() => instance.name);
    });
    await it('Should be able to mock an indirect invocation respecting `this` via .apply', () => {
        // arrange
        const sut = new Mock<(id: string) => string>({ typeof: 'function' });

        // act
        sut.setup(x => x.apply(undefined, ['123'])).returns('success!');
        const instance = sut.instance;

        // assert
        assert.equal(instance('123'), 'success!');
        assert.throws(() => sut.instance('123'));
        assert.throws(() => instance.call(new Date(), '123'));
        assert.throws(() => instance.apply(new Date(), ['123']));
        assert.throws(() => instance('456'));
        assert.throws(() => instance.name);
    });
    await it('Should be able to mock a direct method call ignoring `this`.', () => {
        // arrange
        const sut = new Mock<{ echo(id: string): string; }>({ typeof: 'object' });

        // act
        sut.setup(x => x.echo('123')).returns('success!');
        const instance = sut.instance;

        // assert
        assert.equal(instance.echo('123'), 'success!');
        assert.equal(sut.instance.echo('123'), 'success!');
        assert.equal(instance.echo.call(new Date(), '123'), 'success!');
        assert.equal(instance.echo.apply(new Date(), ['123']), 'success!');
        assert.throws(() => instance.echo('456'));
        assert.throws(() => instance.echo.name);
    });
    await it('Should be able to mock an indirect method call respecting `this` via .call', () => {
        // arrange
        const sut = new Mock<{ echo(this: unknown, id: string): string; }>({ typeof: 'object' });

        // act
        sut.setup(x => x.echo.call(undefined, '123')).returns('success!');
        const instance = sut.instance;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const echo = instance.echo;

        // assert
        assert.equal(echo('123'), 'success!');
        assert.equal(echo.call(undefined, '123'), 'success!');
        assert.equal(echo.apply(undefined, ['123']), 'success!');
        assert.equal(instance.echo.call(undefined, '123'), 'success!');
        assert.equal(instance.echo.apply(undefined, ['123']), 'success!');
        assert.throws(() => instance.echo('123'));
        assert.throws(() => sut.instance.echo('123'));
        assert.throws(() => instance.echo.call(new Date(), '123'));
        assert.throws(() => instance.echo.apply(new Date(), ['123']));
        assert.throws(() => echo('456'));
        assert.throws(() => echo.call(undefined, '456'));
        assert.throws(() => echo.apply(undefined, ['456']));
        assert.throws(() => instance.echo.call(undefined, '456'));
        assert.throws(() => instance.echo.apply(undefined, ['456']));
        assert.throws(() => instance.echo.name);
    });
    await it('Should be able to mock an indirect method call respecting `this` via .apply', () => {
        // arrange
        const sut = new Mock<{ echo(id: string): string; }>({ typeof: 'object' });

        // act
        sut.setup(x => x.echo.apply(undefined, ['123'])).returns('success!');
        const instance = sut.instance;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const echo = instance.echo;

        // assert
        assert.equal(echo('123'), 'success!');
        assert.equal(echo.call(undefined, '123'), 'success!');
        assert.equal(echo.apply(undefined, ['123']), 'success!');
        assert.equal(instance.echo.call(undefined, '123'), 'success!');
        assert.equal(instance.echo.apply(undefined, ['123']), 'success!');
        assert.throws(() => instance.echo('123'));
        assert.throws(() => sut.instance.echo('123'));
        assert.throws(() => instance.echo.call(new Date(), '123'));
        assert.throws(() => instance.echo.apply(new Date(), ['123']));
        assert.throws(() => echo('456'));
        assert.throws(() => echo.call(undefined, '456'));
        assert.throws(() => echo.apply(undefined, ['456']));
        assert.throws(() => instance.echo.call(undefined, '456'));
        assert.throws(() => instance.echo.apply(undefined, ['456']));
        assert.throws(() => instance.echo.name);
    });
});
