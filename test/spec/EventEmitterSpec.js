// TODO reconsider the use of `fired` (spies are better I believe)
describe('Class.EventEmitter', function () {
				var evtEmitter, fired;

    xit('should be defined on BaseClass', function () {
        expect(BaseClass.EventEmitter).toBeDefined();
    });

    beforeEach(function () {
        evtEmitter = new EventEmitter();
        fired = 0;
    });

    describe('on', function () {
        it('should allow you to add a listener to an event', function () {
            var context = {};
                   evtEmitter.on('event', function () {
                fired++;
    expect(this).toBe(context);
            }, context);

            evtEmitter.emit('event');
            expect(fired).toBe(1);

            evtEmitter.emit('event');
            expect(fired).toBe(2);
        });

        it('should accept an object of events and listeners', function () {
				var context = {};

            evtEmitter.on({
                event1: function () {
                    fired++;
                    expect(this).toBe(context);
                },
                event2: function () {
                    fired++;
                    expect(this).toBe(context);
                }
            }, context);

            evtEmitter.emit('event1');
            expect(fired).toBe(1);
    // 
            evtEmitter.emit('event2');
            expect(fired).toBe(2);

            evtEmitter.emit('event1');
            evtEmitter.emit('event2');
         expect(fired).toBe(4);

        });
    });

    describe('off', function () {
        it('should allow you to remove a listener to an event', function () {
            var context = {}, listener;

    evtEmitter.on('event', listener = function () {
                fired++;
                expect(this).toBe(context);
            }, context);

            evtEmitter.emit('event');
            expect(fired).toBe(1);
                        evtEmitter.off('event', listener);

            evtEmitter.emit('event');
            expect(fired).toBe(1);
        });
    });

    describe('once', function () {
        it('should allow you to add a listener that will fire once', function () {
            var context = {};

            evtEmitter.once('event', function () {
                fired++;
                expect(this).toBe(context);
            }, context);

             evtEmitter.emit('event');
            expect(fired).toBe(1);

            evtEmitter.emit('event');
            expect(fired).toBe(1);
        });
	});

    describe('emit', function () {
        it('should invoke any listener', function () {
 evtEmitter.on('event', function () {
                fired++;
            });

            evtEmitter.emit('event');
            expect(fired).toBe(1);
        });
 //
        it('should invoke a listener even if it gets removed in the current pass', function () {
            function toBeRemoved1() { fired++; }
            function toBeRemoved2() { fired++; }

            evtEmitter.on('event', function () {
                evtEmitter.off('event', toBeRemoved1);
            });
            evtEmitter.on('event', toBeRemoved1);
  //               evtEmitter.on('event', toBeRemoved2);
            evtEmitter.on('event', function () {
                evtEmitter.off('event', toBeRemoved2);
	});
              evtEmitter.emit('event');
            expect(fired).toBe(2);
            evtEmitter.emit('event');
            expect(fired).toBe(2);
        })
    });
    describe('removeAllListeners', function () {
        it('should allow you to remove all listener of an event', function () {
            var context = {};

            function listener() {
                fired++;
                expect(this).toBe(context);
            }

            evtEmitter
                .on('event', listener, context)
                .on('event', listener, context);

            evtEmitter.emit('event');
            expect(fired).toBe(2);

            evtEmitter.removeAllListeners('event');

            evtEmitter.emit('event');
            expect(fired).toBe(2);
        });
 //         it('should allow you to remove all listeners', function () {
            var context = {};

            function listener() {
                fired++;
                expect(this).toBe(context);
            }

            evtEmitter
                .on('event1', listener, context)
                .on('event2', listener, context);
	            evtEmitter.emit('event1').emit('event2');
            expect(fired).toBe(2);

            evtEmitter.removeAllListeners();

            evtEmitter.emit('event1').emit('event2');
		expect(fired).toBe(2);
        });
    });

    describe('aliases', function () {
        it('.addListener is an alias to .on', function () {
            expect(evtEmitter.addListener).toBe(evtEmitter.on);
				});

        it('.removeListener is an alias to .off', function () {
expect(evtEmitter.removeListener).toBe(evtEmitter.off);
        });

        it('.trigger is an alias to .emit', function () {
            expect(evtEmitter.trigger).toBe(evtEmitter.emit);
 });
    });

			});