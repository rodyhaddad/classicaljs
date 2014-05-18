describe('createDynamicNameFnSpec', function () {

    afterEach(function () {
        ot.globalObj = window;
    });

    describe('isCspOn', function () {
        it('should return false if the security policy is not active', function () {
            ot.globalObj = {document: {securityPolicy: {isActive: false}}};
            expect(isCspOn()).toBe(false);
        });
        it('should return true if the security policy is active', function () {
            ot.globalObj = {document: {securityPolicy: {isActive: true}}};
            expect(isCspOn()).toBe(true);
        });
    });

    describe('csp: off', function () {
        beforeEach(function () {
            ot.globalObj = {document: {securityPolicy: {isActive: false}}};
        });

        it('should return a named function', function () {
            var fn = createDynamicNameFn('namedFn', {asFunction: ot.noop, asConstructor: ot.noop});
            expect(fn.name).toBe('namedFn');
            expect(typeof fn).toBe('function');
        });

        it('should accept callbacks for when the function is invoked or instantiated', function () {
            var context = {},
                callbacks = {
                    asFunction: jasmine.createSpy('asFunction'),
                    asConstructor: jasmine.createSpy('asConstructor')
                };

            var fn = createDynamicNameFn('namedFn', callbacks);

            fn.call(context, 'param1', 'param2');
            expect(callbacks.asFunction.calls.first()).toEqual({object: context, args: ['param1', 'param2']});

            context = new fn('param3', 'param4');
            expect(callbacks.asConstructor.calls.first()).toEqual({object: context, args: ['param3', 'param4']});

            expect(callbacks.asFunction.calls.count()).toBe(1);
            expect(callbacks.asConstructor.calls.count()).toBe(1);
        });
    });

    describe('csp: on', function () {
        beforeEach(function () {
            ot.globalObj = {document: {securityPolicy: {isActive: true}}};
        });

        it('should return an anonymous function', function () {
            var fn = createDynamicNameFn('namedFn', {asFunction: ot.noop, asConstructor: ot.noop});
            expect(fn.name).toBe('');
            expect(typeof fn).toBe('function');
        });

        it('should accept callbacks for when the function is invoked or instantiated', function () {
            var context = {},
                callbacks = {
                    asFunction: jasmine.createSpy('asFunction'),
                    asConstructor: jasmine.createSpy('asConstructor')
                };

            var fn = createDynamicNameFn('namedFn', callbacks);

            fn.call(context, 'param1', 'param2');
            expect(callbacks.asFunction.calls.first()).toEqual({object: context, args: ['param1', 'param2']});

            context = new fn('param3', 'param4');
            expect(callbacks.asConstructor.calls.first()).toEqual({object: context, args: ['param3', 'param4']});

            expect(callbacks.asFunction.calls.count()).toBe(1);
            expect(callbacks.asConstructor.calls.count()).toBe(1);
        });
    });
});