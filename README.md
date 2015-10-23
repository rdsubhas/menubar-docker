# docker-menu

> Menubar app for Docker built on Electron

<img src="screenshot1.png" />

<img src="screenshot2.png" />

## Building

Run the following commands in the cloned source directory:

* ```npm install```
* ```grunt```

The resulting .app file will be placed in a ```build/``` subdirectory.

## TODO

* **PRIORITY:** Auto updater, this should be the first thing towards a release. The current plan is to use GitHub releases with gh-pages or raw-github as the update server.
* Use browserify or webpack: We tried using it but with both, its showing weird errors related to "makeNodePromisified", etc
