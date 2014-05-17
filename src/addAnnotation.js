function addAnnotation(name, info) {
    this.addDecorator(name, {
        decorate: function (component) {
            component.annotations = component.annotations || [];
            if (ot.isFn(info.annotation)) {
                var annotation = ot.inherit(info.annotation.prototype),
                    returnedValue = info.annotation.apply(annotation, ot.toArray(arguments));

                component.annotations.push(
                    ot.isObject(returnedValue) || ot.isFn(returnedValue) ? returnedValue : annotation);
            } else {
                component.annotations.push(info.annotation);
            }
        }
    });
};