BaseClass.addPlugin("Extends", {
    level: {
        "Class": {
            execute: "first",
            priority: -100,
            onDefinition: function (info) {
                var extendedClass = info.$Class.extends;
                if (extendedClass) {
                    // TODO normalize `constructor`
                    info.$Class.classConstructor.prototype = ot.inherit(
                        extendedClass.classConstructor.prototype,
                        info.$Class.classConstructor.prototype
                    );

                    info.$Class.classConstructor.prototype[info.$Class.config.superName]
                        = extendedClass.classConstructor.prototype;
                }
                return false;
            }
        },
        "OwnComponent": {
            component: function (info) {
                return {value: info.$Class.extends};
            },
            onDefinition: false
        }
    },
    onApply: function (info, object) {
        // TODO string Extends
        if (object && object.$Class) {
            object = object.$Class;
        } else {
            throw "a Class was not given to .Extends()";
        }

        info.$Class.extends = object;
    }
});