function addClassAnnotation(name, info) {
    this.addClassDecorator(name, {
        globalize: info.globalize,
        decorate: function ($class) {
            var annotations = $class.annotations;
            if (ot.isFn(info.annotation)) {
                var annotation = ot.inherit(info.annotation.prototype),
                    returnedValue = info.annotation.apply(annotation, ot.toArray(arguments));

                annotations.push(
                    ot.isObject(returnedValue) || ot.isFn(returnedValue) ? returnedValue : annotation);
            } else {
                annotations.push(info.annotation);
            }
        }
    });
}