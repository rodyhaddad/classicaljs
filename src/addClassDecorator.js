function addClassDecorator(name, info) {
    var $classDefiner = this;
    var queuedDecorators = $classDefiner.queuedDecorators;
    if (info.globalize) {
        ot.navigate.set(ot.globalObj, name, function () {
            var args = ot.toArray(arguments);
            queuedDecorators.push(function ($class) {
                callDecorator.call($class, args);
            });
        });
        $classDefiner.events.on('destroy', function () {
            ot.navigate(ot.globalObj, name, function (value, key, i, road) {
                if (i === road.length - 1) {
                    delete this[key];
                    return false;
                }
            });
        });
    } else {
        var exportFn = exportClassFn(callDecorator);
        ot.navigate.set($classDefiner.fnToExport, name, exportFn, true);
    }

    function callDecorator (args) {
        info.decorate.apply(info, [this].concat(args));

        if (info.on && !this.$$usedPlugins[name]) {
            var on = ot.result(info, 'on', [this]);
            this.on(on, info);
        }
        this.$$usedPlugins[name] = true;
    }
};