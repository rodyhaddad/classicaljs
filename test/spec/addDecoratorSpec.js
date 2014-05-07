describe('addDecorator', function () {
    var components = [];
    beforeEach(function () {
        BaseClass.addComponent('Component', {
            createComponent: function () {
                var obj = {};
                components.push(obj);
                return obj;
            }
        });
    });

    afterEach(function () {
        components = [];
    });

    it('should call the decorate method when the Decorator is invoked', function () {
        var info = {decorate: ot.noop};
        spyOn(info, 'decorate');
        BaseClass.addDecorator('decorator', info);

        BaseClass('name', function () {
            +decorator();
            Component();
        });
        expect(info.decorate).toHaveBeenCalled();
    });

    it('should call the decorate method with the correct parameters', function () {
        var info = {decorate: ot.noop};
        spyOn(info, 'decorate');
        BaseClass.addDecorator('decorator', info);

        var aClass = BaseClass('name', function () {
            +decorator(1, true);
            Component();
        });

        expect(info.decorate).toHaveBeenCalledWith(components[0], aClass.$class, 1, true);
    });

    it('should allow nested Decorators', function () {
        var info = {decorate: ot.noop};
        spyOn(info, 'decorate');

        BaseClass.addDecorator('decorator', info);
        BaseClass.addDecorator('decorator.A', info);
        BaseClass.addDecorator('decorator.A.B', info);
        BaseClass.addDecorator('decorator.A.B.C.D.E', info);
        BaseClass.addDecorator('decorator.A.B.C.F', info);


        BaseClass('name', function () {
            +decorator();
            +decorator.A();
            +decorator.A.B();
            +decorator.A.B.C.D.E();
            +decorator.A.B.C.F();
            Component();
        });

        expect(info.decorate.calls.count()).toBe(5);
    });

    it('should not globalize the Decorator', function () {
        BaseClass.addDecorator('decorator', {decorate: ot.noop});

        expect(typeof decorator).toBe('undefined');
        BaseClass('name', function () {
            expect(typeof decorator).toBe('function');
            +decorator();
            Component();
        });
        expect(typeof decorator).toBe('undefined');
    });

    it('should temporarily add the Decorator to the resulting class', function () {
        var info = {decorate: ot.noop};
        spyOn(info, 'decorate');
        BaseClass.addDecorator('decorator', info);

        var aClass = BaseClass('name', function () {
            expect(typeof this.decorator).toBe('function');
            +this.decorator(1, true);
            this.Component();
        });

        expect(info.decorate).toHaveBeenCalledWith(components[0], aClass.$class, 1, true);
    });

    describe('after', function () {
        it('should attach the decorator to the last component if the after is true', function () {
            var info = {decorate: ot.noop, after: true};
            spyOn(info, 'decorate');
            BaseClass.addDecorator('decorator', info);

            var aClass = BaseClass('name', function () {
                Component() << decorator();
            });

            expect(info.decorate).toHaveBeenCalledWith(components[0], aClass.$class);
        });

        it('should call the after property if it\'s function, with the correct parameters', function () {
            var info = {decorate: ot.noop, after: function (lastComponent, $class, afterOrNot) {
                return afterOrNot;
            }};
            spyOn(info, 'after').and.callThrough();
            BaseClass.addDecorator('decorator', info);

            var aClass = BaseClass('name', function () {
                +decorator(false);
                Component();

                Component() << decorator(true);

                +decorator(false);
                Component();
            });

            expect(info.after.calls.count()).toBe(3);
            expect(info.after.calls.argsFor(0)).toEqual([, aClass.$class, false]);
            expect(info.after.calls.argsFor(1)).toEqual([components[1], aClass.$class, true]);
            expect(info.after.calls.argsFor(2)).toEqual([components[2], aClass.$class, false]);
        })
    });

    describe('on', function () {
        it('should register the listeners to the events only once', function () {
            var info = {decorate: ot.noop, on: {
                event1: ot.noop,
                event2: ot.noop
            }};
            spyOn(info.on, 'event1');
            spyOn(info.on, 'event2');

            BaseClass.addDecorator('decorator', info);

            var aClass = BaseClass('name', function () {
                +decorator();
                +decorator();
                Component();

                +decorator();
                Component();
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