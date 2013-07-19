BaseClass.addPlugin("Public", {
    level: "OwnComponent",
    onDefinition: function (info, name, value) {
        if (ot.isFn(name)) {
            value = name;
            name = value.name;
        }
        if (ot.isFn(value)) {
            info.$Class.classConstructor.prototype[name] = value || null;
        }
    },
    onInstanceCreation: function (info, name, value) {
        if (typeof name === "string" && !ot.isFn(value)) {
            info.instance[name] = value;
        }
    },
    onInvoke: function () {
        console.log("onInvoke", arguments);
    }
});