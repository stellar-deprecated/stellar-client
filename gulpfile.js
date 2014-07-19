'use strict';
// generated on 2014-04-24 using generator-gulp-webapp 0.0.8

var gulp        = require('gulp');
var plumber     = require('gulp-plumber');
var exec        = require('child_process').exec;
var mergeStream = require('merge-stream');
var git         = require('git-rev');
var karma       = require('karma').server;

// load plugins
var $ = require('gulp-load-plugins')();


//composite tasks
gulp.task('default', ['clean'], function () { 
    gulp.start('build'); 
});
gulp.task('develop', ['watch']);
gulp.task('build',   ['html', 'images', 'fonts']);
gulp.task('dist',    ['build']);


//component tasks
gulp.task('styles', ['iconfont'], function () {
    return gulp.src('app/styles/main.scss')
        .pipe(plumber({errorHandler: console.log}))
        .pipe($.sass({
            outputStyle: 'expanded',
            includePaths: ['app/styles', '.tmp/styles']
        }))
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('.tmp/styles'))
        .pipe($.size());
});

gulp.task('scripts', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter($.jshintStylish))
        .pipe($.size());
});

gulp.task('templateCache', function() {
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

    return mergeStream(templates, states)
});

gulp.task('html', ['config', 'styles', 'scripts', 'templateCache'], function (done) {
    git.long(function (revision) {

        var jsFilter = $.filter('**/*.js');
        var cssFilter = $.filter('**/*.css');

        gulp.src('app/**/*.html')
            .pipe($.useref.assets({
                searchPath: ['.tmp', 'app']
            }))

            .pipe(jsFilter)
            .pipe($.replace('_GIT_REVISION_GOES_HERE_',revision))
            .pipe($.ngmin())
            .pipe($.uglify())
            .pipe(jsFilter.restore())
            .pipe(cssFilter)
            .pipe($.replace('bower_components/bootstrap-sass-official/vendor/assets/fonts/bootstrap','fonts'))
            .pipe($.csso())
            .pipe(cssFilter.restore())
            .pipe($.rev())   
            .pipe($.useref.restore())
            .pipe($.useref())

            .pipe($.revReplace())
            .pipe(gulp.dest('dist'))
            .pipe($.size())
            .once('end', done)
            .once('finish', done);
    });
});

gulp.task('images', function () {
    return gulp.src('app/images/**/*')
        .pipe($.cache($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('dist/images'))
        .pipe($.size());
});

gulp.task('fonts', ['iconfont'], function () {
    return mergeStream(
            $.bowerFiles(),
            gulp.src('.tmp/fonts/**/*')
        )
        .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
        .pipe($.flatten())
        .pipe(gulp.dest('dist/fonts'))
        .pipe($.size());
});

gulp.task('config', function() {
    var env = process.env.NODE_ENV || 'development'
    gulp.src('config/' + env + ".js")
        .pipe($.rename(function (path) {
            path.basename = "config";
        }))
        .pipe(gulp.dest('app/scripts'))
});

gulp.task('clean', function () {
    return gulp.src(['.tmp', 'dist'], { read: false }).pipe($.clean());
});


gulp.task('connect', function () {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({ port: 35729 }))
        .use(connect.static('app'))
        .use(connect.static('.tmp'))
        .use(connect.directory('app'));

    require('http').createServer(app)
        .listen(8000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:8000');
        });
});

gulp.task('serve', ['connect', 'styles', 'templateCache'], function () {
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

gulp.task('watch', ['connect', 'serve'], function () {
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
    gulp.watch('app/templates/**/*', ['templateCache']);
    gulp.watch('app/states/**/*', ['templateCache']);
    gulp.watch('bower.json', ['wiredep']);
});

gulp.task("stellar-lib", function(cb) {
    var steps = [
        "cd ../stellar-lib",
        "./node_modules/.bin/grunt webpack",
        "cp build/stellar-0.7.35.js ../stellar-client/app/scripts/libraries/stellar-0.7.35.js"
    ]
    console.log(steps.join(" && "))
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
})

gulp.task('serve-dist', ['connect-dist'], function() {
    require('opn')('http://localhost:8001');
})

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
})


gulp.task('test', function (done) {
    karma.start({
        browsers: ['PhantomJS'],
        frameworks: ['mocha', 'sinon-chai'],
        reporters: ['dots'],
        files: [
            'app/scripts/libraries/stellar-0.7.35.js',
            'app/scripts/utilities/sjcl.js',
            'app/scripts/libraries/sjcl-scrypt.js',

            'app/scripts/utilities/wallet.js',
            'test/helper.js',
            'test/unit/**/*.spec.js'
        ],
        singleRun: true
    }, done);
});


