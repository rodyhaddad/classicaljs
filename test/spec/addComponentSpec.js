describe('addComponent', function () {
    it('should call the createComponent method when the Component is invoked', function () {
        var info = {createComponent: ot.noop};
        spyOn(info, 'createComponent');
        BaseClass.addComponent('Component', info);

        BaseClass('name', function () {
            Component();
        });
        expect(info.createComponent).toHaveBeenCalled();
    });

    it('should call the createComponent method with the correct parameters', function () {
        var info = {createComponent: ot.noop};
        spyOn(info, 'createComponent');
        BaseClass.addComponent('Component', info);

        var aClass = BaseClass('name', function () {
            Component(1, true);
        });

        expect(info.createComponent).toHaveBeenCalledWith(aClass.$class, 1, true);
    });

    it('should allow nested Components', function () {
        var info = {createComponent: ot.noop};
        spyOn(info, 'createComponent');

        BaseClass.addComponent('Component', info);
        BaseClass.addComponent('Component.A', info);
        BaseClass.addComponent('Component.A.B', info);
        BaseClass.addComponent('Component.A.B.C.D.E', info);
        BaseClass.addComponent('Component.A.B.C.F', info);


        BaseClass('name', function () {
            Component();
            Component.A();
            Component.A.B();
            Component.A.B.C.D.E();
            Component.A.B.C.F();
        });

        expect(info.createComponent.calls.count()).toBe(5);
    });

    it('should not globalize the Component', function () {
        BaseClass.addComponent('Component', {createComponent: ot.noop});

        expect(typeof Component).toBe('undefined');
        BaseClass('name', function () {
            expect(typeof Component).toBe('function');
            Component();
        });
        expect(typeof Component).toBe('undefined');
    });

    it('should temporarily add the Component to the resulting class', function () {
        var info = {createComponent: ot.noop};
        spyOn(info, 'createComponent');
        BaseClass.addComponent('Component', info);

        var aClass = BaseClass('name', function () {
            expect(typeof this.Component).toBe('function');
            this.Component(1, true)
        });
        expect(aClass.Component).toBeUndefined();

        expect(info.createComponent).toHaveBeenCalledWith(aClass.$class, 1, true);
    });

    describe('on', function () {
        it('should register the listeners to the events only once', function () {
            var info = {createComponent: ot.noop, on: {
                event1: ot.noop,
                event2: ot.noop
            }};
            spyOn(info.on, 'event1');
            spyOn(info.on, 'event2');

            BaseClass.addComponent('Component', info);

            var aClass = BaseClass('name', function () {
                Component();
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