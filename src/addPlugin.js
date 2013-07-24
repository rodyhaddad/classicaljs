BaseClass.registeredPlugins = {};
BaseClass.addPlugin = function addPlugin(name, info) {
    if (ot.isObject(name)) {
        info = name;
        name = info.name;
    } else {
        info.name = name;
    }
    var $ClassDefiner = this;

    ot.softMerge(info, {
        level: "Component",
        priority: Plugin.priorities["default"]
    });

    var plugin = new Plugin(name, info, this);

    if (info.addToInstances !== false) {
        ot.navigate.setOwn(this.prototype, name, function () {
            var invokeValue = plugin.invoke(this.$Class, ot.toArray(arguments));
            return ot.isUndefined(invokeValue) ? this.$Class : invokeValue;
        });

        if (name.indexOf(".") !== -1) {
            var firstProp = name.split(".")[0];
            this.toInherit[firstProp] = this.prototype[firstProp];
        }
    }

    if (info.exportPlugin !== false) {
        ot.navigate.setOwn(this.valuesToExport, name, exportClassFn(name));
    }

    if (info.globalize === true) {
        ot.navigate.setOwn(ot.globalObj, name, function () {
            var args = ot.toArray(arguments),
                invokeValue = plugin.invoke(null, args, false);

            $ClassDefiner.$$queuedPlugins.push({plugin: plugin, args: args});
            return invokeValue;
        });
    }

    this.registeredPlugins[name] = plugin;
    return this;
};