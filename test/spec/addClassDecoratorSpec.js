// TODO test globalize (need a way to clean up)
describe('addClassDecorator', function () {

    it('should call the decorate method when the Decorator is invoked', function () {
        var info = {decorate: ot.noop};
        spyOn(info, 'decorate');
        BaseClass.addClassDecorator('decorator', info);

        BaseClass('name', function () {
            ~decorator();
        });
        expect(info.decorate).toHaveBeenCalled();
    });

    it('should call the decorate method with the correct parameters', function () {
        var info = {decorate: ot.noop};
        spyOn(info, 'decorate');
        BaseClass.addClassDecorator('decorator', info);

        var aClass = BaseClass('name', function () {
            ~decorator(1, true);
        });

        expect(info.decorate).toHaveBeenCalledWith(aClass.$class, 1, true);
    });

    it('should allow nested Decorators', function () {
        var info = {decorate: ot.noop};
        spyOn(info, 'decorate');

        BaseClass.addClassDecorator('decorator', info);
        BaseClass.addClassDecorator('decorator.A', info);
        BaseClass.addClassDecorator('decorator.A.B', info);
        BaseClass.addClassDecorator('decorator.A.B.C.D.E', info);
        BaseClass.addClassDecorator('decorator.A.B.C.F', info);


        BaseClass('name', function () {
            +decorator();
            +decorator.A();
            +decorator.A.B();
            +decorator.A.B.C.D.E();
            +decorator.A.B.C.F();
        });

        expect(info.decorate.calls.count()).toBe(5);
    });

    it('should temporarily add the Decorator to the resulting class', function () {
        var info = {decorate: ot.noop};
        spyOn(info, 'decorate');
        BaseClass.addClassDecorator('decorator', info);

        var aClass = BaseClass('name', function () {
            expect(typeof this.decorator).toBe('function');
            +this.decorator(1, true);
        });

        expect(info.decorate).toHaveBeenCalledWith(aClass.$class, 1, true);
    });

    xdescribe('globalize', function () {

        it('should not globalize the Decorator by default', function () {
            var info = {decorate: ot.noop};
            spyOn(info, 'decorate');
            BaseClass.addClassDecorator('decorator', info);

            expect(typeof decorator).toBe('undefined');
            BaseClass('name', function () {
                expect(typeof decorator).toBe('function');
                +decorator();
            });
            expect(typeof decorator).toBe('undefined');

            expect(info.decorate.calls.count()).toBe(1);
        });

        it('should globalize the Decorator if asked to', function () {
            var info = {decorate: ot.noop, globalize: true};
            spyOn(info, 'decorate');
            BaseClass.addClassDecorator('decorator', info);

            expect(typeof decorator).toBe('function');
            +decorator();
            BaseClass('name1', function () {
                expect(typeof decorator).toBe('function');

                +decorator();
                BaseClass('name2', function () {
                    expect(typeof decorator).toBe('function');
                });
            });
            expect(typeof decorator).toBe('function');

            expect(info.decorate.calls.count()).toBe(2);
        });
    });

    describe('on', function () {
        it('should register the listeners to the events only once', function () {
            var info = {decorate: ot.noop, on: {
                event1: ot.noop,
                event2: ot.noop
            }};
            spyOn(info.on, 'event1');
            spyOn(info.on, 'event2');

            BaseClass.addClassDecorator('decorator', info);

            var aClass = BaseClass('name', function () {
                +decorator();
                +decorator();
            });

            aClass.$class.emit('event1', [1]);
            aClass.$class.emit('event2', [true]);

            expect(info.on.event1.calls.count()).toBe(1);
            expect(info.on.event2.calls.count()).toBe(1);

            expect(info.on.event1.calls.first()).toEqual({object: info, args: [1]});
            expect(info.on.event2.calls.first()).toEqual({object: info, args: [true]});
        });
    });
});