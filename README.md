<p align="center"><img alt="mail-a-tron logo" src="http://i.imgur.com/xv9y0Te.png" width="150"></p>
<p align="center">
<strong>Perceptual diffing suite</strong>
<br>
built on <a href="https://github.com/segmentio/nightmare">Nightmare</a> by <a href="https://segment.com">Segment</a>
<br><br>
<a href="https://circleci.com/gh/segmentio/niffy"><img src="https://circleci.com/gh/segmentio/niffy.svg?style=shield" /></a>
<a href="https://npmjs.com/package/niffy"><img src="https://img.shields.io/npm/v/niffy.svg" /></a>
</p>

## Overview

Niffy is a library to help you build end-to-end tests that are augmented with automatic visual change detection.

Niffy does not need to store files beyond a tmp directory. Instead, it makes live requests to two different domains of your choosing, and reports an error if they differentiate above a certain threshold.

## Getting Started

    npm install --save niffy

### Runtime Requirements

  - `global.Promise`
  - Generator functions

## Example


```js
var Niffy = require('niffy');

var baseUrl = 'https://staging.example.com';
var testUrl = 'http://localhost:3000';


describe('End-to-End Test', function () {

  var userCreds = {}

  before(function () {
    var nightmareOptions = { /* ... */ };

    niffy = new Niffy(baseUrl, testUrl, nightmareOptions);

    userCreds.base = { email: '1@cool.com', password: 'abc123' };
    userCreds.test = { email: '2@cool.com', password: 'abc123' };
  });

  after(function () {
    return niffy.end();
  });

  it('Signs in and clicks The Button', function () {

    return niffy
      .goto('/')

      // This will compare across your base and test domains :)
      .screenshot('home-page')

      // Alternatively: .goto('/', 'home-page')

      .navigate(function * (nightmare, type) {
        //
        // Sign Up
        //
        yield nightmare
          .type('[name=email]', userCreds[type].email)
          .type('[name=password]', userCreds[type].password)
          .click('button[type=submit]')
          .wait('.signed-in-page', 2000)
      })

      // Take a screenshot after submitting.
      .screenshot('sign-in-form')

      //
      // .capture() is both .navigate() and .screenshot() in one!
      //
      .capture('after-button-click', function * (nightmare, type) {
        //
        // Click The Button
        //
        yield nightmare.click('button.the')
      })

      .execute(); // Release the hounds!
  });

});
```

### Niffy(basehost, testhost[, options])
To create a new Niffy differ:

```js
var niffy = new Niffy(basehost, testhost, nightmareOptions);
```

* `basehost` is the url that is assumed "good"
* `testhost` is the url that you are comparing to the base
* `nightmareOptions` can be seen [here in the Nightmare docs](https://github.com/segmentio/nightmare#nightmareoptions)
  * `.threshold` is the maximum percentage difference for a passing test (default: 0.2%)

### .goto(url[, screenshotName])
This method queues an instruction to go to a `url`. If `screenshotName` is provided, then niffy will also take and compare screenshots.


### .navigate(fn)
This method queues `fn`, which is expected to be a **generator function** that takes two parameters:

```js
niffy.navigate(function * (nightmare, type) {
  return nightmare.type(...).click(...);
})
```

where `nightmare` is a nightmare instance, and `type` is either `"base"` or `"test"`, in that order.

### .screenshot(name)
This method queues a screenshot to be taken, typically after a `.navigate()`. It will store a temporary file under `/tmp/niffy/` with the given `name`, so be sure to choose a name that is unique within the scope of your single test!

### .capture(name, fn)
A handy convenience function that queues both `.navigate(fn)` and `.screenshot(name)`.

### .execute()
Runs all queued actions twice – first against your base domain, then against your test domain. Also the queue.

### .end()
This method shuts down the underlying Nightmare instance (e.g. freeing up memory). Typically you'll use `.end()` in the `after` method of a mocha test suite, like this:



## License (MIT)

```
WWWWWW||WWWWWW
 W W W||W W W
      ||
    ( OO )__________
     /  |           \
    /o o|    MIT     \
    \___/||_||__||_|| *
         || ||  || ||
        _||_|| _||_||
       (__|__|(__|__|
```
Copyright (c) 2017 Segment.io, Inc. friends@segment.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
