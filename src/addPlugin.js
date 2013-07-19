BaseClass.registeredPlugins = {};
BaseClass.addPlugin = function addPlugin(name, info) {
    if (ot.isObject(name)) {
        info = name;
        name = info.name;
    } else {
        info.name = name;
    }

    this.registeredPlugins[name] = new Plugin(name, info, this);
};