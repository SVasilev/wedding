# Ivana and Stefan's Wedding

## Toolchain

1. Install Python (3.13.3), NodeJS (22.15.0) and Ruby (3.4.3)
2. Install gulp
    ```
    $ npm install -g gulp@4.0.2
    ```
3. Install Node Modules
    ```
    $ npm install
    ```
4. Install Ruby Gems
    ```
    $ bundle
    ```

## Run the site locally
```
$ gulp
```
The command does the following:
- Compresses the Images and copies them to `./_site/images`
- Minifies and copies JS files from `_js-es6` folder to the `_site` folder
- Minifies and copies CSS files from `_sass` folder to the `_site` folder
- Runs BrowserSync (automatically opens the browser at `localhost:3000`) and watches for any changes done to the `index.html` in the root folder as well as changes to javascript files in `_js-es6` and changes to CSS files in `_sass`.

## Production Build
```
$ gulp build
```
Similar to the command above but does not run BrowserSync and instead compresses the Images and copies them to `./_site/images`

## Deploy

Any pushes to the master branch, will trigger a GitHub action (namely, `gulp build`) which deploys the site.
