function addComponent(name, info) {
    this.addClassDecorator(name, {
        on: info.on && function ($class) {
            var on = ot.result(info, 'on', [$class]);
            $class.on(on, info);
        },
        decorate: function ($class) {
            $class.addComponent(info.createComponent.apply(info, ot.toArray(arguments)));
        }
    });
};