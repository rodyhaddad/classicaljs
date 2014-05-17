function createFnSpy(fn) {
    var obj = {}, name = fn.name || 'name';
    obj[name] = fn;
    spyOn(obj, name).and.callThrough();
    return obj[name];
}

afterEach(function () {
    BaseClass.destroy();
    BaseClass = createBaseClass();
});