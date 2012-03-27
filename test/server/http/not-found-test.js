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

function notFound() {
  this.res.writeHead(404, { 'Content-Type': 'application/json' });
  this.res.end(JSON.stringify({"not": "found"}));
}

function createServer (router) {
  return http.createServer(function (req, res) {
    router.dispatch(req, res, function (err) {
      if (err) {
        res.writeHead(500);
        res.end();
      }
    });
  });
}

function assertNotFound (uri) {
  return {
    topic: function () {
      request({ uri: 'http://localhost:9097/' + uri, 
                json: true }, this.callback);
    },
    "should respond with what was defined in notfound": function (err, res, body) {
      assert.isNull(err);
      assert.equal(res.statusCode, 404);
      assert.deepEqual(body,{not: "found"});
    }
  };
}

vows.describe('director/server/http/notfound').addBatch({
  "An instance of director.http.Router": {
    "instantiated with a Routing table": {
      topic: new director.http.Router({}, { notfound: notFound }),
      "should have the correct routes defined": function (router) {
        assert.isFunction(router.notfound);
      },
      "when passed to an http.Server instance": {
        topic: function (router) {
          var server = createServer(router);
          server.listen(9097, this.callback);
        },
        "a request to notfound": assertNotFound('notfound')
      }
    }
  }
}).export(module);
