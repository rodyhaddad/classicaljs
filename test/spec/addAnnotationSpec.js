describe('addAnnotation', function () {
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

    it('should add the annotation value when the Annotation is invoked', function () {
        var info = {annotation: {}};
        BaseClass.addAnnotation('annotation', info);

        BaseClass('name', function () {
            +annotation();
            Component();
        });
        expect(components[0].annotations).toEqual([info.annotation]);
    });

    it('should call the annotation function with the correct parameters', function () {
        var info = {annotation: jasmine.createSpy('annotation')};
        BaseClass.addAnnotation('annotation', info);


        var aClass = BaseClass('name', function () {
            +annotation(1, true);
            Component();
        });
        expect(components[0].annotations.length).toBe(1);
        expect(info.annotation).toHaveBeenCalledWith(components[0], aClass.$class, 1, true);
    });

    describe('annotation instantiation', function () {
        it('should instantiate the annotation function when the Annotation is invoked', function () {
            function Annotation() {}
            BaseClass.addAnnotation('annotation', {
                annotation: Annotation
            });

            BaseClass('name', function () {
                +annotation();
                Component();
            });
            expect(components[0].annotations.length).toBe(1);
            expect(components[0].annotations[0] instanceof Annotation).toBe(true);
        });

        it('should handle the instantiated annotation function returning an object or a function', function () {
            function Annotation1() {return {}}
            BaseClass.addAnnotation('annotation1', {
                annotation: Annotation1
            });
            function Annotation2() {return ot.noop}
            BaseClass.addAnnotation('annotation2', {
                annotation: Annotation2
            });

            BaseClass('name', function () {
                +annotation1();
                +annotation2();
                Component();
            });

            expect(components[0].annotations.length).toBe(2);
            expect(components[0].annotations[0]).toEqual({});
            expect(components[0].annotations[1]).toEqual(ot.noop);
        });
    });

    it('should allow nested Annotations', function () {
        var info = {annotation: jasmine.createSpy('annotaion')};

        BaseClass.addAnnotation('annotation', info);
        BaseClass.addAnnotation('annotation.A', info);
        BaseClass.addAnnotation('annotation.A.B', info);
        BaseClass.addAnnotation('annotation.A.B.C.D.E', info);
        BaseClass.addAnnotation('annotation.A.B.C.F', info);


        BaseClass('name', function () {
            +annotation();
            +annotation.A();
            +annotation.A.B();
            +annotation.A.B.C.D.E();
            +annotation.A.B.C.F();
            Component();
        });

        expect(info.annotation.calls.count()).toBe(5);
    });

    it('should not globalize the Annotation', function () {
        BaseClass.addAnnotation('annotation', {annotation: ot.noop});

        expect(typeof annotation).toBe('undefined');
        BaseClass('name', function () {
            expect(typeof annotation).toBe('function');
            +annotation();
            Component();
        });
        expect(typeof annotation).toBe('undefined');
    });

    it('should temporarily add the Annotation to the resulting class', function () {
        var info = {annotation: jasmine.createSpy('annotaion')};
        BaseClass.addAnnotation('annotation', info);

        var aClass = BaseClass('name', function () {
            expect(typeof this.annotation).toBe('function');
            +this.annotation(1, true);
            this.Component();
        });
        expect(aClass.annotation).toBeUndefined();

        expect(info.annotation).toHaveBeenCalledWith(components[0], aClass.$class, 1, true);
    });

});