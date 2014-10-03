'use strict';
// generated on 2014-04-24 using generator-gulp-webapp 0.0.8

var gulp          = require('gulp');
var child_process = require('child_process')
var exec          = child_process.exec;
var mergeStream   = require('merge-stream');
var git           = require('git-rev');
var karma         = require('karma').server;
var _             = require('lodash');
var fs            = require('fs');
var runSequence   = require('run-sequence');
var path          = require('path');
var protractor    = require("gulp-protractor").protractor;
var glob          = require('glob');

// load plugins
var $ = require('gulp-load-plugins')();

var paths = {
    js:   ["./app/scripts/**/*.js", '!./app/scripts/libraries/**/*.js'],
    html: ['app/**/*.html', '!app/bower_components/**/*.html']
};

//composite tasks
gulp.task('default', ['build']);
gulp.task('develop', ['watch']);
gulp.task('develop-docs', ['watch-docs']);
gulp.task('build', function(done) {
  runSequence('clean', ['html', 'images', 'fonts'], done);
});
gulp.task('dist',    ['build']);
gulp.task('scripts', ['scripts:lint', 'scripts:templateCache', 'scripts:unminified', 'scripts:docs']);


//component tasks
gulp.task('styles', ['iconfont'], function () {
    return gulp.src('app/styles/main.scss')
        .pipe($.plumber({errorHandler: console.log}))
        .pipe($.sass({
            outputStyle: 'expanded',
            includePaths: ['app/styles', '.tmp/styles']
        }))
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('.tmp/styles'))
        .pipe($.size());
});


gulp.task('scripts:lint', function () {
    return gulp.src(paths.js)
        .pipe($.jshint())
        .pipe($.jshint.reporter($.jshintStylish))
        .pipe($.size());
});

gulp.task('scripts:unminified', ['scripts:templateCache'], function () {
    return gulp.src(paths.html)
        .pipe($.plumber({errorHandler: function(err) {
          $.util.log($.util.colors.red(err));  
        }}))
        .pipe($.useref.assets({
            searchPath: ['.tmp', 'app'],
            types:["js"]
        }))
        .pipe($.useref.restore())
        .pipe($.filter('**/*.js'))
        .pipe($.ngAnnotate())
        .pipe(gulp.dest('dist'));
});

gulp.task('scripts:templateCache', function() {
    var templates = gulp.src('app/templates/**/*.html')
        .pipe($.angularTemplatecache({
            filename: 'scripts/templates.js',
            root: 'templates',
            module: 'stellarClient'
        }))
        .pipe(gulp.dest('.tmp'));

    var states = gulp.src('app/states/**/*.html')
        .pipe($.angularTemplatecache({
            filename: 'scripts/states.js',
            root: 'states',
            module: 'stellarClient'
        }))
        .pipe(gulp.dest('.tmp'));

    return mergeStream(templates, states);
});

gulp.task('scripts:docs', $.shell.task(['./node_modules/.bin/jsdoc -c ./jsdoc.conf.json'], {ignoreErrors:true}));

gulp.task('html', ['config', 'styles', 'scripts', 'flash'], function (done) {
    git.long(function (revision) {

        var jsFilter = $.filter('**/*.js');
        var cssFilter = $.filter('**/*.css');

        gulp.src(paths.html)
            .pipe($.useref.assets({
                searchPath: ['.tmp', 'app']
            }))

            .pipe(jsFilter)
            .pipe($.sourcemaps.init())
            .pipe($.replace('_GIT_REVISION_GOES_HERE_',revision))
            .pipe($.ngAnnotate())
            .pipe($.uglify())
            .pipe($.rev())
            .pipe(jsFilter.restore())
            .pipe(cssFilter)
            .pipe($.replace('bower_components/bootstrap-sass-official/vendor/assets/fonts/bootstrap','fonts'))
            .pipe($.csso())
            .pipe($.rev())
            .pipe(cssFilter.restore())
            .pipe($.useref.restore())
            .pipe($.useref())

            .pipe($.revReplace())
            .pipe($.sourcemaps.write("./", {sourceRoot: "/", includeContent: false}))
            .pipe(gulp.dest('dist'))
            .pipe($.size())
            .once('end', done)
            .once('finish', done);
    });
});

gulp.task('flash', function () {
    return gulp.src('app/**/*.swf')
        .pipe(gulp.dest('dist'))
        .pipe($.size());
});

gulp.task('images', function () {
    return gulp.src('app/images/**/*')
        .pipe($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest('dist/images'))
        .pipe($.size());
});

gulp.task('fonts', ['iconfont'], function () {
    return mergeStream(
            $.bowerFiles(),
            gulp.src(['app/fonts/**/*', '.tmp/fonts/**/*'])
        )
        .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
        .pipe($.flatten())
        .pipe(gulp.dest('dist/fonts'))
        .pipe($.size());
});

gulp.task('config', function() {
    var env = process.env.NODE_ENV || 'dev';
    gulp.src('config/' + env + ".js")
        .pipe($.rename(function (path) {
            path.basename = "config";
        }))
        .pipe(gulp.dest('app/scripts'));
});

gulp.task('ensure_config', function() {
    if(!fs.existsSync("app/scripts/config.js")) {
        return gulp.start('config-stg');
    }
});

_(['dev', 'stg', 'prd']).each(function(env) {
    gulp.task('config-' + env, function() {
        process.env.NODE_ENV = env;
        gulp.start('config');
    });
});

gulp.task('clean', function () {
    return gulp.src(['.tmp', 'dist', 'api-docs'], { read: false }).pipe($.clean());
});


gulp.task('connect', function () {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({ port: 35729 }))
        .use(connect.static('app'))
        .use(connect.static('.tmp'))
        .use(connect.directory('app'))
        .use('/api-docs', connect.static('api-docs'))
        .use('/api-docs', connect.directory('api-docs'));

    require('http').createServer(app)
        .listen(8000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:8000');
        });
});

gulp.task('serve', ['connect', 'styles', 'scripts'], function () {
    require('opn')('http://localhost:8000');
});

// inject bower components
gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            directory: 'app/bower_components'
        }))
        .pipe(gulp.dest('app/styles'));

    gulp.src('app/*.html')
        .pipe(wiredep({
            directory: 'app/bower_components',
            exclude: ['bootstrap-sass-official']
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('watch', ['ensure_config', 'connect', 'serve'], function () {
    var server = $.livereload();

    // watch for changes

    gulp.watch([
        'app/*.html',
        '.tmp/styles/**/*.css',
        'app/scripts/**/*.js',
        '.tmp/scripts/**/*.js',
        'app/images/**/*'
    ]).on('change', function (file) {
        server.changed(file.path);
    });

    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/images/**/*', ['images']);
    gulp.watch('app/icons/**/*', ['iconfont']);
    gulp.watch('app/templates/**/*', ['scripts:templateCache']);
    gulp.watch('app/states/**/*', ['scripts:templateCache']);
    gulp.watch('bower.json', ['wiredep']);
});

gulp.task('watch-docs', ['ensure_config', 'connect', 'serve'], function () {
    var server = $.livereload();

    // watch for changes

    gulp.watch(['api-docs/*.html']).on('change', function (file) {
        server.changed(file.path);
    });

    gulp.watch('app/scripts/**/*.js', ['scripts']);
});

gulp.task("stellar-lib", function(cb) {
    var steps = [
        "cd ../stellar-lib",
        "./node_modules/.bin/grunt webpack",
        "cp build/stellar-0.7.35.js ../stellar-client/app/scripts/libraries/stellar-0.7.35.js"
    ];
    console.log(steps.join(" && "));
    exec(steps.join(" && "), function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('iconfont', function() {
    var fontName = 'stellar-client';
    return gulp.src(['app/icons/*.svg'])
        .pipe($.iconfontCss({
            fontName: fontName,
            targetPath: '../styles/_icons.scss',
            fontPath: '../fonts/',
            path: 'scss'
        }))
        .pipe($.iconfont({
            fontName: fontName,
            normalize: true
         }))
        .pipe(gulp.dest('.tmp/fonts/'));
});


gulp.task('connect-dist', ['dist'], function() {
    var connect = require('connect');
    var app = connect()
        .use(connect.static('dist'))
        .use(connect.directory('dist'));

    require('http').createServer(app)
        .listen(8001)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:8001');
        });
});

gulp.task('serve-dist', ['connect-dist'], function() {
    require('opn')('http://localhost:8001');
});

gulp.task('serve-dist-without-build', [], function() {
    var connect = require('connect');
    var app = connect()
        .use(connect.static('dist'))
        .use(connect.directory('dist'));

    require('http').createServer(app)
        .listen(8001)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:8001');
            require('opn')('http://localhost:8001');
        });
});

gulp.task('ensure_webdriver_standalone',function(done) {
  child_process.spawn(path.resolve(require("gulp-protractor").getProtractorDir() + '/webdriver-manager'), ['update', '--standalone'], {
    stdio: 'inherit'
  }).once('close', done);
});

gulp.task('test', ['ensure_webdriver_standalone'], function (done) {
    var searchPath = path.join(__dirname, 'node_modules', 'protractor', 'selenium', 'selenium-server-*.jar');
    var files = glob.sync(searchPath);
    var jarPath = files[0];

    if(!jarPath) {
        throw new Error('Unable to find ' + searchPath);
    }

    gulp.src(["./src/tests/e2e/spec/*_spec.js"])
      .pipe(protractor({
        seleniumServerJar: jarPath,
        configFile: "test/e2e/protractor_conf.js"
      }))
      .on('error', function(e) { throw e })
      .on('end', function() {
        done();
      });
});
