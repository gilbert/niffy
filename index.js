/*jshint esnext:true*/

var debug = require('debug')('niffy');
var Nightmare = require('nightmare');
var mkdirp = require('mkdirp');
var fs = require('fs');
var defaults = require('defaults');
var sprintf = require('sprintf-js').sprintf;
var diffImages = require('./lib/diff');
var co = require('co');

/**
 * Export `Niffy`
 */

module.exports = Niffy;

/**
 * Initialize `Nightmare`
 *
 * @param {String} base
 * @param {String} test
 * @param {Object} options
 */

function Niffy(base, test, options) {
  if (!(this instanceof Niffy)) return new Niffy(base, test, options);
  options = defaults(options, { show: false, width: 1400, height: 1000, threshold: .2 });

  this.queue = []

  this.nightmare = new Nightmare(options);
  this.basehost = base;
  this.testhost = test;
  this.starts = {};
  this.profiles = {};
  this.errorThreshold = options.threshold;
}



/**
 * goto a specific path and optionally take some actions.
 *
 * @param {String} path
 * @param {String} (Optional) If given, takes a screenshot of the given name
 */

Niffy.prototype.goto = function (path, name) {
  this.queue.push({ type: 'goto', path: path });

  if ( name ) {
    this.queue.push({ type: 'screenshot', name: name })
  }

  return this;
};

function* runGoto (type, path) {
  var destination = this[type+'host'] + path

  this.startProfile('goto');
  yield this.nightmare.goto(destination);
  this.stopProfile('goto');
};

/**
 * Convenience function to both navigate and screenshot.
 *
 * @param {String} name
 * @param {Function} fn
 */
Niffy.prototype.capture = function (name, threshold, fn) {
  if ( arguments.length === 2 ) {
    fn = threshold
    threshold = this.errorThreshold
  }
  this.queue.push({ type: 'navigate', fn: fn });
  this.queue.push({ type: 'screenshot', name: name, threshold: threshold });
  return this;
};


/**
 * Navigate nightmare, without taking a screenshot.
 *
 * @param {Function} fn
 */
Niffy.prototype.navigate = function (fn) {
  this.queue.push({ type: 'navigate', fn: fn });
  return this;
};

function* runNavigate (type, fn) {
  this.startProfile('navigate');
  yield timeout(1000);
  yield fn(this.nightmare, type);
  yield timeout(2000);
  this.stopProfile('navigate');
}

/**
 * Screenshot and compare across base and test domains.
 *
 * @param {String} name
 * @param {Number} (Optional) threshold
 */
Niffy.prototype.screenshot = function (name, threshold) {
  this.queue.push({ type: 'screenshot', name: name, threshold: threshold || this.errorThreshold })
  return this
}


function* runScreenshot (type, name, threshold) {
  var pathBase = imgfilepath('base', name);
  var pathTest = imgfilepath('test', name);
  var pathDiff = imgfilepath('diff', name);

  /**
   * Screenshot
   */

  this.startProfile('screenshot');
  yield this.nightmare.wait(5000).screenshot( type === 'base' ? pathBase : pathTest )
  this.stopProfile('screenshot');
  yield timeout(250);

  if ( type !== 'test' ) {
    return
  }

  /**
   * Diff
   */

  this.startProfile('diff');
  var diff = yield diffImages(pathBase, pathTest, pathDiff);
  this.stopProfile('diff');

  diff.percentage = diff.differences / diff.total * 100;

  /**
   * Compare
   */

  var pct = '' + Math.floor(diff.percentage * 10000) / 10000 + '%';
  var failMessage = sprintf('%s different (> %s threshold), open %s', pct, threshold+'%', pathDiff);
  var absolutePct = Math.abs(diff.percentage);

  debug('"%s" diffed %s (%s threshold)', name, diff.percentage+'%', threshold+'%');

  if (diff.percentage > threshold) {
    throw new Error(failMessage);
  }
};


Niffy.prototype.execute = co.wrap(function * () {

  var types = ['base', 'test'];

  for (var t=0; t < 2; t++) {

    for (var i=0; i < this.queue.length; i++) {
      var action = this.queue[i];

      if ( action.type === 'goto' ) {
        yield runGoto.call(this, types[t], action.path);
      }
      else if ( action.type === 'navigate' ) {
        yield runNavigate.call(this, types[t], action.fn);
      }
      else if ( action.type === 'screenshot' ) {
        yield runScreenshot.call(this, types[t], action.name, action.threshold);
      }
    }
  }

  this.queue = []
})


/**
 * End the session.
 */

Niffy.prototype.end = function* () {
  yield this.nightmare.end();

  debug(
    'profile\n\tgoto %s\n\tscreenshot %s\n\tdiff %s',
    this.profiles.goto,
    this.profiles.screenshot,
    this.profiles.diff
  );
};

/**
 * Mark an execution start time.
 *
 * @param {String} name
 */

Niffy.prototype.startProfile = function (name) {
  var start = new Date().getTime();
  this.starts[name] = start;
};

/**
 * Mark an execution stop time.
 *
 * @param {String} name
 */

Niffy.prototype.stopProfile = function (name) {
  var end = new Date().getTime();
  if (!this.starts[name]) return;
  if (this.profiles[name]) this.profiles[name] += (end - this.starts[name]);
  else this.profiles[name] = (end - this.starts[name]);
};

/**
 * Utils
 */

function imgfilepath(type, name) {
  var filepath = '/tmp/niffy';
  if (filepath.slice(-1) !== '/') filepath += '/';
  mkdirp(filepath);
  return (filepath + name + '-' + type + '.png');
}

function* timeout(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  })
}
