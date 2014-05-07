BaseClass.addComponent = function (name, info) {
    function handleComponentCreation(args) {
        this.addComponent(info.createComponent.apply(info, [this].concat(args)));
        if (info.on && !this.$$usedPlugins[name]) {
            this.on(info.on, info);
        }
        this.$$usedPlugins[name] = true;
    }

    var exportFn = exportClassFn(handleComponentCreation);

    ot.navigate.set(this.fnToExport, name, exportFn, true);
    //ot.navigate.set(this.prototype, name, exportFn, true);
};