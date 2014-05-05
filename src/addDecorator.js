BaseClass.addDecorator = function (name, info) {
    function handleAnnotationAddition(args) {
        var lastComponent;
        if (info.after && ot.result(info, 'after', [lastComponent = this.getLastComponent(), this].concat(args))) {
            info.decorate.apply(info, [lastComponent, this].concat(args));
        } else {
            this.once('newComponent', function (component) {
                info.decorate.apply(info, [component, this].concat(args));
            }, this);
        }
        if (info.on && !this.$$usedPlugins[name]) {
            this.on(info.on);
        }
        this.$$usedPlugins[name] = true;
    }

    var exportFn = exportClassFn(handleAnnotationAddition);

    ot.navigate.set(this.fnToExport, name, exportFn, true);
    //ot.navigate.set(this.prototype, name, exportFn, true);
};