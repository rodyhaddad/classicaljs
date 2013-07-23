BaseClass.addPlugin("Public", {
    level: "OwnComponent",
    component: function (info, name, value) {
        return {name: name, value: value};
    },
    onApply: function (info, name, value) {
        if (ot.isFn(name)) {
            value = name;
            name = value.name;
        }
        info.args[0] = name;
        info.args[1] = value || null;
    },
    onDefinition: function (info, name, value) {
        var prototype = info.$Class.classConstructor.prototype;

        function updatePrototype(value) {
            if (ot.isFn(value)) {
                prototype[name] = value
            } else {
                delete prototype[name];
            }
        }

        updatePrototype(value);
        info.component.on("change:value", updatePrototype);
    },
    onInstanceCreation: function (info, name, value) {
        if (!ot.isFn(value)) {
            info.instance[name] = value;
        }
    }
});