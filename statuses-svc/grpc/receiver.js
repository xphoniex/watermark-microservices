const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')

const PROTO_PATH = __dirname + '/proto/ticketstatus.proto'

var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    })

const ticketstatus = grpc.loadPackageDefinition(packageDefinition).ticketstatus

/**
 * statusUpdate handler. Gets a stream of status updates, and responds with
 * {success: true} or {success: false}.
 * @param {Readable} call The status updates stream.
 * @param {function(Error, routeSummary)} callback The callback to pass the
 *     response to
 */
function statusUpdate(call, callback) {
  call.on('data', function(update) {
    exports.onReceive(update)
  })

  call.on('end', function() {
    // do nothing
    //callback(null, { success:true })
  })
}

/**
 * Get a new server with the handler functions in this file bound to the methods
 * it serves.
 * @return {Server} The new server object
 */
function getServer() {
  var server = new grpc.Server()
  server.addService(ticketstatus.TicketStatus.service, {
    statusUpdate: statusUpdate
  })
  return server
}

const server = getServer()
server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure())
server.start()

exports.onReceive = () => {}
