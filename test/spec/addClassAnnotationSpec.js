describe('addClassAnnotation', function () {

    it('should add the annotation value when the Annotation is invoked', function () {
        var info = {annotation: {}};
        BaseClass.addClassAnnotation('annotation', info);

        var aClass = BaseClass('name', function () {
            +annotation();
        });
        expect(aClass.$class.annotations).toEqual([info.annotation]);
    });

    it('should call the annotation function with the correct parameters', function () {
        var info = {annotation: jasmine.createSpy('annotation')};
        BaseClass.addClassAnnotation('annotation', info);


        var aClass = BaseClass('name', function () {
            +annotation(1, true);
        });
        expect(aClass.$class.annotations.length).toBe(1);
        expect(info.annotation).toHaveBeenCalledWith(aClass.$class, 1, true);
    });

    describe('annotation instantiation', function () {
        it('should instantiate the annotation function when the Annotation is invoked', function () {
            function Annotation() {}
            BaseClass.addClassAnnotation('annotation', {
                annotation: Annotation
            });

            var aClass = BaseClass('name', function () {
                +annotation();
            });
            expect(aClass.$class.annotations.length).toBe(1);
            expect(aClass.$class.annotations[0] instanceof Annotation).toBe(true);
        });
        });

        it('should handle the instantiated annotation function returning an object or a function', function () {
            function Annotation1() {return {}}
            BaseClass.addClassAnnotation('annotation1', {
                annotation: Annotation1
            });
            function Annotation2() {return ot.noop}
            BaseClass.addClassAnnotation('annotation2', {
                annotation: Annotation2
         });

var aClass = BaseClass('name', function () {
                +annotation1();
                +annotation2();
            });

            expect(aClass.$class.annotations.length).toBe(2);
 //             expect(aClass.$class.annotations[0]).toEqual({});
	expect(aClass.$class.annotations[1]).toEqual(ot.noop);
        });
    });
     it('should allow nested Annotations', function () {
        var info = {annotation: jasmine.createSpy('annotation')};

        BaseClass.addClassAnnotation('annotation', info);
        BaseClass.addClassAnnotation('annotation.A', info);
             BaseClass.addClassAnnotation('annotation.A.B', info);
        BaseClass.addClassAnnotation('annotation.A.B.C.D.E', info);
        BaseClass.addClassAnnotation('annotation.A.B.C.F', info);


        BaseClass('name', function () {
            +annotation();
            +annotation.A();
            +annotation.A.B();
            +annotation.A.B.C.D.E();
            +annotation.A.B.C.F();
        });
//   
        expect(info.annotation.calls.count()).toBe(5);
    });

    describe('globalize: false', function () {
        it('should not globalize the Annotation by default', function () {
            var info = {annotation: jasmine.createSpy('annotation')};
            BaseClass.addClassAnnotation('annotation', info);

            expect(typeof annotation).toBe('undefined');
            BaseClass('name', function () {
                expect(typeof annotation).toBe('function');
                +annotation();
            });
            expect(typeof annotation).toBe('undefined');

            expect(info.annotation.calls.count()).toBe(1);
        });

        it('should apply the Annotation to the Class being currently built', function () {
            var info = {annotation: jasmine.createSpy('annotation')};
            BaseClass.addClassAnnotation('annotation', info);

           var aClass, aClass2;
            var aClass = BaseClass('name1', function () {
                +annotation();
                aClass2 = BaseClass('name2', function () {
                    +annotation();
                });
            });

            expect(info.annotation.calls.argsFor(0)).toEqual([aClass.$class]);
            expect(info.annotation.calls.argsFor(1)).toEqual([aClass2.$class]);
    //           });

    });

    describe('globalize: true', function () {
        it('should globalize the Annotation if asked to', function () {
            var info = {annotation: jasmine.createSpy('annotation'), globalize: true};
            BaseClass.addClassAnnotation('annotation', info);

            expect(typeof annotation).toBe('function');
            BaseClass('name1', function () {
                expect(typeof annotation).toBe('function');
            });
            expect(typeof annotation).toBe('function');

        });

        it('should apply the Annotation to the next Class', function () {
            var info = {annotation: jasmine.createSpy('annotation'), globalize: true};
            BaseClass.addClassAnnotation('annotation', info);

            var aClass, aClass2;
            +annotation();
            aClass = BaseClass('name1', function () {
                +annotation();
                aClass2 = BaseClass('name2', ot.noop);
            });

            expect(info.annotation.calls.argsFor(0)).toEqual([aClass.$class]);
            expect(info.annotation.calls.argsFor(1)).toEqual([aClass2.$class]);
        });

        it('should only apply the Annotation to its ClassDefiner branch', function () {
            var infoParent = {annotation: jasmine.createSpy('parentAnn'), globalize: true},
                infoChild = {annotation: jasmine.createSpy('childAnn'), globalize: true},
                childClass = BaseClass.child('child'),
                diffBranchClass = BaseClass.child('diffBranchClass'),
                aClass;

            BaseClass.addClassAnnotation('parentAnn', infoParent);
            childClass.addClassAnnotation('childAnn', infoChild);

            // on same branch
            +parentAnn();
            +childAnn();
            aClass = childClass('name', ot.noop);

            expect(infoParent.annotation).toHaveBeenCalledWith(aClass.$class);
            expect(infoChild.annotation).toHaveBeenCalledWith(aClass.$class);

            infoParent.annotation.calls.reset();
            infoChild.annotation.calls.reset();

            // on parent's branch
            +parentAnn();
            +childAnn();
            aClass = BaseClass('name', ot.noop);

					expect(infoParent.annotation).toHaveBeenCalledWith(aClass.$class);
            expect(infoChild.annotation).not.toHaveBeenCalled();

            aClass = childClass('name', ot.noop);

            expect(infoChild.annotation).toHaveBeenCalledWith(aClass.$class);

            infoParent.annotation.calls.reset();
            infoChild.annotation.calls.reset();

            // on different branch
            +parentAnn();
            +childAnn();
 aClass = diffBranchClass('name', ot.noop);

                expect(infoParent.annotation).toHaveBeenCalledWith(aClass.$class);
            expect(infoChild.annotation).not.toHaveBeenCalled();

            aClass = childClass('name', ot.noop);

            expect(infoChild.annotation).toHaveBeenCalledWith(aClass.$class);


        });

    });
                     it('should temporarily add the Annotation to the resulting class', function () {
        var info = {annotation: jasmine.createSpy('annotation')};
        BaseClass.addClassAnnotation('annotation', info);

        var aClass = BaseClass('name', function () {
            expect(typeof this.annotation).toBe('function');
            +this.annotation(1, true);
        });
        expect(aClass.annotation).toBeUndefined();

        expect(info.annotation).toHaveBeenCalledWith(aClass.$class, 1, true);
                });


});