module.exports = function (grunt) {
    var files = [
        "src/classicaljs.prefix",
        "libs/*.js",
        "src/EventEmitter.js",
        "src/createDynamicNameFn.js",
        "src/exportValues.js",
        "src/addClassDecorator.js",
        "src/addComponent.js",
        "src/addDecorator.js",
        "src/addAnnotation.js",
        "src/BaseClass.js",
        "src/**.js",
        "src/classicaljs.suffix"
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        destName: 'classical',
        LICENSE: grunt.file.read("LICENSE"),
        concat: {
            options: {
                separator: '\n\n',
                banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> \n<%= LICENSE %>\n*/\n\n'
            },
            dist: {
                src: files,
                dest: 'dist/<%= destName %>.js'
            }
        },
        uglify: {
            options: {
                preserveComments: 'some' //Licences
            },
            dist: {
                files: {
                    'dist/<%= destName %>.min.js': ['dist/<%= destName %>.js']
                }
            }
        },
        jshint: {
            files: ['src/**.js'],
            options: {
                boss: true,
                globals: {
                    module: true
                }
            }
        },
        watch: {
            src: {
                files: files.concat(['test/spec/*.js', 'test/spec/**.js']),
                tasks: ['concat', 'uglify']
            }
        },

        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            },
            watchUnit: {
                configFile: 'karma.conf.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('lint', ['jshint']);

    grunt.registerTask('build', ['concat', 'uglify']);


    grunt.registerTask('test', ['build', 'karma:unit']);
    grunt.registerTask('autotest', ['build', 'karma:watchUnit']);


    grunt.registerTask('default', ['lint', 'build']);

};