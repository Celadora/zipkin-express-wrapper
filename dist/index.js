const config = require('config');

const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;
const zipkin = require('zipkin');
const {Tracer, BatchRecorder, ExplicitContext} = require('zipkin');
const {HttpLogger} = require('zipkin-transport-http');

const ctxImpl = new zipkin.ExplicitContext();
const recorder = new zipkin.BatchRecorder({
  logger: new HttpLogger({
    endpoint: config.get('zipkin.httpLogger.endpoint')
  })
});

var tracer = new zipkin.Tracer({
  recorder, //: new zipkin.ConsoleRecorder(),
  ctxImpl // this would typically be a CLSContext or ExplicitContext
});

var middleware = zipkinMiddleware({
  tracer: tracer,
  serviceName: config.get('service'), // name of this application
  port: config.get('port')
});

var traceId, parentId;

module.exports = {
  middleware: function(req, res, next) {

    return middleware(req, res, function(req, res) {
      traceId = tracer.id.traceId;
      parentId = tracer.id.spanId;

      next();
    })
  },
  setHeaders: function(req) {


    if(traceId) req.headers["X-B3-TraceId"] = traceId;
    if(parentId) req.headers["X-B3-ParentSpanId"] = parentId;
    var childId = tracer.createChildId();
    var spanId = childId.spanId

    req.headers["X-B3-SpanId"] = spanId;

    return req;
  }
}

var zipkinTracerValues = {};
