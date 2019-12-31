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
const GRPC_DEST = process.env.GRPC_DEST || 'statuses.watermark:50051'
const client = new ticketstatus.TicketStatus(GRPC_DEST, grpc.credentials.createInsecure())

let call
createNewCall = () => {
  call = client.statusUpdate((err, data) => {
    if (err) {
      setTimeout(() => createNewCall(), 1000)
      return console.error('error:', err.details)
    }
    console.log(data)
  })
}
createNewCall()

const sendUpdate = (m) => { call.write({ticket: m.ticket, status: m.status}) }

exports.sendUpdate = sendUpdate
