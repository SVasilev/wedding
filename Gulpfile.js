var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass')(require('sass'));
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var sourcemaps = require('gulp-sourcemaps');
var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var imagemin = require('gulp-imagemin');

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
 gulp.task('jekyll-develop', function (done) {
     browserSync.notify(messages.jekyllBuild);
     return cp.spawn('bundle', ['exec', 'jekyll', 'build'], {stdio: 'inherit', shell: true})
         .on('close', done);
 });

/**
 * Compile files from _scss
 */
gulp.task('sass-develop', function () {
    return gulp.src('_sass/main.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 3 versions'], { cascade: true }))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('_site/css'))
        .pipe(browserSync.reload({stream:true}));
});

/**
 * Compile files from _js
 */
 gulp.task('js-develop', function () {
    var bundler = browserify({
      entries: '_js-es6/app.js',
      debug: true
    });
    bundler.transform(babelify);

    return bundler.bundle()
      .on('error', function (err) { console.error(err); })
      .pipe(source('app.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('_site/js'))
      .pipe(browserSync.reload({stream:true}));
  });

gulp.task('jekyll-build', function (done) {
    return cp.spawn('bundle', ['exec', 'jekyll', 'build'], {stdio: 'inherit', shell: true})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', gulp.series('jekyll-develop', function (done) {
    browserSync.reload();
    done();
}));

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', gulp.series('sass-develop', 'js-develop', 'jekyll-develop', function(done) {
    browserSync({
        server: {
            baseDir: '_site'
        }
    }, done);
}));

gulp.task('sass-build', function () {
    return gulp.src('_sass/main.scss')
        .pipe(sass({
            includePaths: ['scss']
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('_site/css'));
});



gulp.task('js-build', function (done) {
  var bundler = browserify({
    entries: '_js-es6/app.js',
    debug: true
  });

  bundler.transform(babelify);

    return bundler.bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(gulp.dest('_site/js'))
});

/**
 * Copy and compress any site images
 */
 gulp.task('copy-photos', () =>
     gulp.src('images/**/*.{jpg,png,svg}')
         .pipe(imagemin())
         .pipe(gulp.dest('_site/images'))
 );

 gulp.task('copy-videos', () =>
     gulp.src('images/video/*.mp4')
         .pipe(gulp.dest('_site/images/video'))
 );

 gulp.task('copy-images', gulp.parallel('copy-photos', 'copy-videos'))

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
  gulp.watch(['_js-es6/**/*.js'], gulp.series('js-develop'));
  gulp.watch(['_sass/**/*.scss'], gulp.series('sass-develop'));
  gulp.watch(['**/*.html', '**/*.markdown', '**/*.md'], gulp.series('jekyll-rebuild'));
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', gulp.series('browser-sync', 'watch'));

/**
 * Gulp 'build' task which is used to build the site on the production box.
 */
gulp.task('build', gulp.series('copy-images', 'jekyll-build', 'sass-build', 'js-build'));
