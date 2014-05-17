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
        expect(aClass.decorator).toBeUndefined();

        expect(info.decorate).toHaveBeenCalledWith(aClass.$class, 1, true);
    });

    describe('globalize: false', function () {
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

        it('should apply the Decorator to the Class being currently built', function () {
            var info = {decorate: jasmine.createSpy('decorate')};
            BaseClass.addClassDecorator('decorator', info);

            var aClass, aClass2;
            var aClass = BaseClass('name1', function () {
                +decorator();
                aClass2 = BaseClass('name2', function () {
                    +decorator();
                });
            });

            expect(info.decorate.calls.argsFor(0)).toEqual([aClass.$class]);
            expect(info.decorate.calls.argsFor(1)).toEqual([aClass2.$class]);
        });

    });

    describe('globalize: true', function () {
        it('should globalize the Decorator if asked to', function () {
            var info = {decorate: ot.noop, globalize: true};
            spyOn(info, 'decorate');
            BaseClass.addClassDecorator('decorator', info);

            expect(typeof decorator).toBe('function');
            BaseClass('name1', function () {
                expect(typeof decorator).toBe('function');
            });
            expect(typeof decorator).toBe('function');

        });

        it('should apply the Decorator to the next Class', function () {
            var info = {decorate: jasmine.createSpy('decorate'), globalize: true};
            BaseClass.addClassDecorator('decorator', info);

            var aClass, aClass2;
            +decorator();
            aClass = BaseClass('name1', function () {
                +decorator();
                aClass2 = BaseClass('name2', ot.noop);
            });

            expect(info.decorate.calls.argsFor(0)).toEqual([aClass.$class]);
            expect(info.decorate.calls.argsFor(1)).toEqual([aClass2.$class]);
        });

        it('should only apply the Decorator to its ClassDefiner branch', function () {
            var infoParent = {decorate: jasmine.createSpy('parentDec'), globalize: true},
                infoChild = {decorate: jasmine.createSpy('childDec'), globalize: true},
                childClass = BaseClass.child('child'),
                diffBranchClass = BaseClass.child('diffBranchClass'),
                aClass;

            BaseClass.addClassDecorator('parentDec', infoParent);
            childClass.addClassDecorator('childDec', infoChild);

            // on same branch
            +parentDec();
            +childDec();
            aClass = childClass('name', ot.noop);

            expect(infoParent.decorate).toHaveBeenCalledWith(aClass.$class);
            expect(infoChild.decorate).toHaveBeenCalledWith(aClass.$class);

            infoParent.decorate.calls.reset();
            infoChild.decorate.calls.reset();

            // on parent's branch
            +parentDec();
            +childDec();
            aClass = BaseClass('name', ot.noop);

            expect(infoParent.decorate).toHaveBeenCalledWith(aClass.$class);
            expect(infoChild.decorate).not.toHaveBeenCalled();

            aClass = childClass('name', ot.noop);

            expect(infoChild.decorate).toHaveBeenCalledWith(aClass.$class);

            infoParent.decorate.calls.reset();
            infoChild.decorate.calls.reset();

            // on different branch
            +parentDec();
            +childDec();
            aClass = diffBranchClass('name', ot.noop);

            expect(infoParent.decorate).toHaveBeenCalledWith(aClass.$class);
            expect(infoChild.decorate).not.toHaveBeenCalled();

            aClass = childClass('name', ot.noop);

            expect(infoChild.decorate).toHaveBeenCalledWith(aClass.$class);


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