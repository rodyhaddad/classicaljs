Class.Config({
    keepDefinedClasses: false,
    allowJSNativeMode: false
});


describe("This Should Be Working: ", function(){
    
    //test the basic Public/Private methods, as well as Constructors
    describe("[Basic] A Class in ClassicalJS", function(){
        
        var constructCalls = 0;
        
        var testClass = 
            Class("testClass")
                
                /*
                 *  Just helpers for accessing private stuff
                 *   get: returns a private property
                 *   call: calls and returns a private method
                 */
                Public(function get(propertyName){
                    return this[propertyName];
                });
                
                Public(function call(methodName){
                    return this[methodName]();
                });
                
                Constructor(function(){
                    constructCalls++ ;
                })
                
                
                Public("publicProperty", 1);
                Private("privateProperty", 2);
                
                
                Public("publicMethod", function(){
                    return 3;
                });
                
                Private(function privateMethod(){
                    return 4;
                });
                
            End();
            
        var testInstance = new testClass();
        
        it("can have Private and Public properties with default values", function(){
            expect(testInstance.publicProperty).toBe(1);
            
            expect(testInstance.privateProperty).toBeUndefined();
            expect(testInstance.get("privateProperty")).toBe(2);
            
        });
        
        
        it("can have Private and Public methods", function(){
            
            expect(testInstance.publicMethod()).toBe(3);
            
            expect(testInstance.privateMethod).toBeUndefined();
            
            expect(testInstance.call("privateMethod")).toBe(4);
            
        });
        
        it("can have a Constructor that is called once for each new instance", function(){
            expect(constructCalls).toBe(1);
        });
        
    });
    
    //Test all the configuration options
    describe("[Configs] A Class in ClassicalJS", function(){
        
        it("has a constructorName config", function(){
            var testConstructorName = 
                Class("testConstructorName", {constructorName: "construct"})
                    
                    Constructor(function(){
                        expect(this.construct).toEqual( jasmine.any(Function) )
                        expect(this.init).toBeUndefined()
                    });
                    
                End();
            
            new testConstructorName();
            
            
        });
        
        it("has a superName config", function(){
            var toInheret = 
                Class("toInheret")
                
                    Protected(function inheretedMethod(){
                        
                    })
                    
                End()
            
            var inheritTest = 
                Class("inheritTest", { superName: "_super" }).Extends(toInheret)
                
                    Constructor(function(){
                        expect(this._super.inheretedMethod).toBeDefined();
                    })
                
                End()
    
    
            new inheritTest();
            
        })
        
        
        it("has a globalize config", function(){
            
            var globalizeTestFalse = 
                Class("globalizeTestFalse", { globalize: false })
        
                    expect(typeof Public === "undefined").toBe(true);
                    expect(typeof globalizeTestFalse.Public === "undefined").toBe(false);
                    
                globalizeTestFalse.End();
            
            
            var globalizeTestTrue = 
                Class("globalizeTestTrue", { globalize: true })
        
                    expect(typeof Public === "undefined").toBe(false);
                    expect(typeof globalizeTestTrue.Public === "undefined").toBe(false);
                
                globalizeTestTrue.End();
            
            
        })
        
        it("has a keepDefinedClasses config", function(){
            
            Class("keepDefinedClassesTestFalse", {keepDefinedClasses: false})
            End();
            
            Class("keepDefinedClassesTestTrue", {keepDefinedClasses: true})
            End();
            
            expect(Class.definedClasses["keepDefinedClassesTestFalse"]).toBeUndefined();
            
            expect(Class.definedClasses["keepDefinedClassesTestTrue"]).toBeDefined();
            
        })
        
        it("has a allowJSNativeMode config", function(){
            
            var allowJSNativeModeTestFalse = 
                Class("allowJSNativeModeTestFalse", {allowJSNativeMode: false})
                
                    Public(function testThis(that){
                        return this === that;
                    })
                
                End();
            
            var allowJSNativeModeTestTrue = 
                Class("allowJSNativeModeTestTrue", {allowJSNativeMode: true})
                
                    Public(function testThis(that){
                        return this === that;
                    })
                
                End();
            
            
            var instance;
            
            instance = new allowJSNativeModeTestFalse();
            expect(instance.testThis(instance)).toBe(false);
            
            instance = new allowJSNativeModeTestTrue();
            expect(instance.testThis(instance)).toBe(true);
            
        })
        
        
        it("inherits from globalConfig", function(){
            
            Class.Config({
                globalize: false
            });
            
            var globalConfigTest = 
                Class("globalConfigTest")
        
                    expect(typeof Public === "undefined").toBe(true);
                
                globalConfigTest.End();
            
            Class.Config({
                globalize: true
            });
            
            var globalConfigTest = 
                Class("globalConfigTest")
        
                    expect(typeof Public === "undefined").toBe(false);
                
                globalConfigTest.End();
        })
        
        
    });
    
    describe("[Inheritance] A Class in ClassicalJS", function(){
        
        var superConstructor = false,
            protectedDefined = false,
            privateNotDefined = false;
        
        var toInheret = 
            Class("toInheret", { keepDefinedClasses: true, constructorName: "init" })
                
                Public("constructorShouldReturn", 1)
                
                Constructor(function(){
                    return 1;
                })
                
                Public(function publicMethod(){
                    return 2;
                })
                
                Protected(function protectedMethod(){
                    return 3;
                })
                
                Private(function privateMethod(){
                    return 4;
                })
                
            End()
        
        var inheritTest = 
            Class("inheritTest", { superName: "Super", allowJSNativeMode: false }).Extends(toInheret)
            
                Constructor(function(){
                    if(this.Super.init() === this.Super.constructorShouldReturn){
                        superConstructor = true;
                    }
                    
                    if(typeof this.protectedMethod !== "undefined"){
                        protectedDefined = true
                    }
                    
                    if(typeof this.privateMethod === "undefined"){
                        privateNotDefined = true
                    }
                    
                })
            
            End()
        
        var instance = new inheritTest();
        
        it("can access the methods/properties of it's Super", function(){
            expect(superConstructor).toBe(true);
        })
        
        it("inherits from the Class it Extends, with Public/Protected/Private layers working", function(){
            expect(instance.publicMethod).toBeDefined();
            
            expect(protectedDefined).toBe(true);
            
            expect(privateNotDefined).toBe(true);
            
        })
        
    });
    
    
    describe("[Multiple Arguments] When Defining a Class, .Public/.Protected/.Private", function(){
        it("can handle multiple arguments at once", function(){
        
            var multipleArgumentsTest = 
                Class("multipleArgumentsTest")
                    
                    Public("test1");
                    
                    Public(function test2(){
                        
                    })
                    
                    Public("test3", function(){
                        
                    })
                    
                    Public({
                        test4: null,
                        test5: function(){
                            
                        },
                        test6: true
                    }, function test7(){
                        
                    }, 
                     "test8",
                     { test9: false },
                     function test10(){
                         
                     }
                    )
                    
                    Public({
                        test11: "cool",
                        test12: true,
                        test13: function(){
                            
                        }
                    })
                    
                    
                End()
            
            var instance = new multipleArgumentsTest();
            
            expect(instance.test1).toBeDefined();
            expect(instance.test2).toBeDefined();
            expect(instance.test3).toBeDefined();
            expect(instance.test4).toBeDefined();
            expect(instance.test5).toBeDefined();
            expect(instance.test6).toBeDefined();
            expect(instance.test7).toBeDefined();
            expect(instance.test8).toBeDefined();
            expect(instance.test9).toBeDefined();
            expect(instance.test10).toBeDefined();
            expect(instance.test11).toBeDefined();
            expect(instance.test12).toBeDefined();
            expect(instance.test13).toBeDefined();
            
        })
    });






    describe("[Plugins]", function(){
        
    })

})