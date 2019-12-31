const http = require('http')

const sendToBroker = (doc) => {

	const data = JSON.stringify(doc)
	const now = parseInt(Date.now() / 1000)

	const options = {
	  hostname: 'default-broker.watermark',
	  port: 80,
	  path: '/',
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json',
		'Content-Length': data.length,
		'Ce-Id': String(now),
		'Ce-Specversion': 0.3,
		'Ce-Type': 'pending-watermark',
		'Ce-Source': 'watermark-service'
	  }
	}

	const req = http.request(options, res => {})

	req.on('error', error => {
	  console.error(error)
	})

	req.write(data)
	req.end()
}

module.exports = sendToBroker
