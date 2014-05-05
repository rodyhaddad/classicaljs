describe('BaseClass', function () {
    describe('instantiation', function () {
        var constructor;
        beforeEach(function () {
            constructor = new BaseClass('name', ot.noop);
        });

        it('should allow you to create a class', function () {
            expect(typeof constructor).toBe('function');
        });

        it('shouldn\'t mind if you omit the new keyword', function () {
            constructor = BaseClass('name', ot.noop);
            expect(typeof constructor).toBe('function');
        });

        it('should add a reference to the class object on the class constructor and instances', function () {
            expect(constructor.$class).toBeDefined();
            expect(constructor.prototype.$class).toBeDefined();
        });

        it('should allow you to instantiate the class it returns', function () {
            expect(new constructor()).toBeDefined();
        });
    });

    describe('child', function () {
        var define;

        it('should create an isolated layer for plugins', function () {
            var child1 = BaseClass.child('child1'),
                child2 = child1.child('child2');

            child1.addComponent('Isolated', {
                createComponent: ot.noop
            });
            child2.addDecorator('Isolated2', {
                decorate: ot.noop
            });

            // Isolated plugin should only be available for child
            child1('name', define = createFnSpy(function () {
                expect(typeof Isolated).toBe('function');
                expect(typeof Isolated2).toBe('undefined');
            }));
            expect(define).toHaveBeenCalled();

            child2('name', define = createFnSpy(function () {
                expect(typeof Isolated).toBe('function');
                expect(typeof Isolated2).toBe('function');
            }));
            expect(define).toHaveBeenCalled();

            // but not for BseClass
            BaseClass('name', define = createFnSpy(function () {
                expect(typeof Isolated).toBe('undefined');
                expect(typeof Isolated2).toBe('undefined');
            }));
            expect(define).toHaveBeenCalled();
        });
    });
});