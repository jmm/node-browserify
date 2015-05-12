/*
Test that b.require() can not add a transform by passing a `transform` property
on an arg.
*/

var browserify = require('../');
var test = require('tap').test;
var through = require('through2');
var path = require('path');

var requirePath = path.join(__dirname, 'tr', 'package.json');

[
    ['b.require() file path with file.transform prop', {
        requirePath: requirePath,
        transformVia: 'file',
    }],

    ['b.require() file path with opts.transform prop', {
        requirePath: requirePath,
        transformVia: 'opts',
    }],
].forEach(function (cfg) {
    test(cfg[0], function (t) {
        requireTest(t, cfg[1]);
    });
});

function requireTest (t, opts) {
    opts = opts || {};
    t.plan(1);

    // Meaningless fodder. Just need a file to pass through the pipeline.
    var entry = through();
    entry.end(Buffer(';'));

    var requireArgs = { opts: {} };

    if (opts.requirePath) requireArgs.file = { file: opts.requirePath };
    else {
        // Fodder. Just need a stream to pass to b.require().
        requireArgs.file = through();
        requireArgs.file.end(Buffer(';'));
        requireArgs.file.file = 'nonexistent';
    }

    // This prop should end up being disregarded, whichever arg it's on.
    requireArgs[opts.transformVia].transform = transform;

    // b.require() currently treats b.require(obj) and b.require([obj])
    // differently, at least when `obj` is not a stream. Hence the array wrapper
    // here. See:
    // https://github.com/substack/node-browserify/issues/1220
    if (opts.requirePath) requireArgs.file = [requireArgs.file];

    // This should not be called.
    function transform (file) {
        t.fail('Transform should not have been added.');
        return through();
    }

    browserify(entry)
      // This call should not result in a transform being registered.
      .require(requireArgs.file, requireArgs.opts)
      .bundle(function (err, src) {
          if (err) throw err;
          // If t.passing() was available I'd use it in combination here. It'd
          // probably be superfluous, but documentation isn't good enough to
          // tell.
          t.pass();
      });
}
// requireTest
