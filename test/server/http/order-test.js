/*
 * http-test.js: Tests for basic HTTP server(s). 
 *
 * (C) 2011, Nodejitsu Inc.
 * MIT LICENSE
 *
 */
 
var assert = require('assert'),
    http = require('http'),
    vows = require('vows'),
    request = require('request'),
    director = require('../../../lib/director');

function hello(you) {
  return function () {
    this.res.writeHead(200, { 'Content-Type': 'text/plain' });
    this.res.end(JSON.stringify({hello: you}));
  };
}

function notFound() {
  this.res.writeHead(404, { 'Content-Type': 'application/json' });
  this.res.end(JSON.stringify({"hello": "__notfound/blerg"}));
}

function createServer (router) {
  return http.createServer(function (req, res) {
    router.dispatch(req, res, function (err) {
      if (err) {
        res.writeHead(404);
        res.end();
      }
    });
  });
}

function assertGet (what) {
  var vow = {
    topic: function () {
      request({ uri: 'http://localhost:9099/' + what, json: true },
        this.callback);
    }
  };
  vow["should respond with hello " + what] =
    function (err, res, body) {
      assert.isNull(err);
      assert.equal(res.statusCode, what === '__notfound/blerg' ? 404 : 200);
      assert.deepEqual(body, {"hello": what});
    };
  return vow;
}

vows.describe('director/server/order').addBatch({
  "An instance of director.http.Router": {
    "instantiated with a Routing table": {
      topic: new director.http.Router({
        '/inbox': {
          get: hello('inbox')
        }, 
        '/:user': {
          get: hello('user')
        }
      }, { 
        notfound: notFound 
      }),
      "should have the correct routes defined": function (router) {
        assert.isObject(router.routes.inbox);
        assert.isFunction(router.routes.inbox.get);
      },
      "when passed to an http.Server instance": {
        topic: function (router) {
          var server = createServer(router);
          server.listen(9099, this.callback);
        },
        "a request to inbox": assertGet('inbox'),
        "a request not found": assertGet('__notfound/blerg')
      }
    }
  }
}).export(module);