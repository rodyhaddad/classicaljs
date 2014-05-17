BaseClass.eventListeners.push({
    beforeDefined: function ($class) {
        var queuedDecorators = $class.$classDefiner.queuedDecorators;
        ot.forEach(queuedDecorators, function (decorator) {
            decorator($class);
        });
        queuedDecorators.length = 0;
    }
});

BaseClass.addClassDecorator = function (name, info) {
    var $classDefiner = this;
    var queuedDecorators = $classDefiner.queuedDecorators;
    if (info.globalize) {
        ot.navigate.set(ot.globalObj, name, function () {
            var args = ot.toArray(arguments);
            queuedDecorators.push(function ($class) {
                callDecorator.call($class, args);
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