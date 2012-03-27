/*
 * attach-test.js: Tests 'router.attach' functionality.
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

function helloWorld() {
  this.res.writeHead(200, { 'Content-Type': 'application/json' });
  this.res.end(JSON.stringify(this.data));
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

function assertMethod (uri, method) {
  method = method || "GET";
  return {
    topic: function () {
      request({ uri: 'http://localhost:9091/' + uri, 
                method: method, json: true }, this.callback);
    },
    "should respond with `this.data` if not head": function (err, res, body) {
      assert.isNull(err);
      assert.equal(res.statusCode, 200);
      // Why the body needs to be stringified, I don't know.
      // Someone should look into this.
      if (method !== 'HEAD') {
        assert.deepEqual(body, [1, 2, 3]);
      }
    }
  };
}

vows.describe('director/server/http/attach').addBatch({
  "An instance of director.http.Router": {
    "instantiated with a Routing table": {
      topic: new director.http.Router({
        '/hello': {
          get: helloWorld,
          patch: helloWorld
        },
        '/custom': {
          on: helloWorld
        }
      }),
      "should have the correct routes defined": function (router) {
        assert.isObject(router.routes.hello);
        assert.isFunction(router.routes.hello.get);
      },
      "when passed to an http.Server instance": {
        topic: function (router) {
          router.attach(function () {
            this.data = [1,2,3];
          });

          var server = createServer(router);
          server.listen(9091, this.callback);
        },
        "a request to hello": assertMethod('hello'),
        "a head request to hello": assertMethod('hello', 'HEAD'),
        "a patch request to hello": assertMethod('hello', 'PATCH'),
        "a GET request to custom": assertMethod('custom', 'GET'),
        "a custom request to custom": assertMethod('custom', 'XYZ')
      }
    }
  }
}).export(module);
