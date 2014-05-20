function addDecorator(name, info) {

    this.addClassDecorator(name, {
        on: info.on && function ($class) {
            var on = ot.result(info, 'on', [$class]);
            $class.on(on, info);
        },
        decorate: function($class) {
            var lastComponent, args = ot.toArray(arguments);
            if (info.after && ot.result(info, 'after', [lastComponent = $class.getLastComponent()].concat(args))) {
                info.decorate.apply(info, [lastComponent].concat(args));
            } else {
                $class.once('newComponent', function (component) {
                    info.decorate.apply(info, [component].concat(args));
                }, this);
            }
        }
    });
}