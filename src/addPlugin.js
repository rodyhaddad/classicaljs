BaseClass.registeredPlugins = {};
BaseClass.addPlugin = function addPlugin(name, info) {
    if (ot.isObject(name)) {
        info = name;
        name = info.name;
    } else {
        info.name = name;
    }

    ot.softMerge(info, {
        level: "Component",
        priority: Plugin.priorities["default"]
    });
    var plugin = new Plugin(name, info, this);

    ot.navigate.setOwn(this.prototype, name, function () {
        plugin.invoke(this.$Class, ot.toArray(arguments));
    });

    ot.navigate.setOwn(this.valuesToExport, name, exportClassFn(name));

    this.registeredPlugins[name] = plugin;
};