const { createHmac, createHash } = require('crypto')
const qs = require('querystring')

const hmac = (secret, x) => createHmac('sha256', secret)
  .update(x)
  .digest()

const hash = x => createHash('sha256')
  .update(x)
  .digest('hex')

module.exports = function sign3(url) {
  return {
    get: (bucket, key, expires, headers) => sign({ method: 'GET', url, bucket, key, expires, headers }),
    put: (bucket, key, expires, headers) => sign({ method: 'PUT', url, bucket, key, expires, headers })
  }
}

function sign({
  url,
  bucket,
  key,
  method = 'GET',
  expires = 60 * 60 * 24 * 7,
  headers = {},
  region = 'us-east-1'
}) {
  const { host, username, password, protocol } = new URL(url)
      , header = method === 'GET' ? headers : {}
      , iso = new Date().toISOString()
      , date = iso.slice(0, 4) + iso.slice(5, 7) + iso.slice(8, 10)
      , time = date + 'T' + iso.slice(11, 13) + iso.slice(14, 16) + iso.slice(17, 19) + 'Z'

  const scope = date + '/' + region + '/s3/aws4_request'

  const queryString = qs.stringify({
    ...header,
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': username + '/' + scope,
    'X-Amz-Date': time,
    'X-Amz-Expires': expires,
    'X-Amz-SignedHeaders': 'host'
  })

  const request = [
    'AWS4-HMAC-SHA256',
    time,
    scope,
    hash([
      method,
      '/' + bucket + '/' + key,
      queryString.split('&').sort().join('&'),
      'host:' + host,
      '',
      'host',
      'UNSIGNED-PAYLOAD'
    ].join('\n'))
  ].join('\n')

  const signature = [date, region, 's3', 'aws4_request', request]
    .reduce((acc, x) => hmac(acc, x), 'AWS4' + password).toString('hex')

  return protocol + '//' + host + '/' + bucket + '/' + key + '?' + queryString + '&X-Amz-Signature=' + signature
}
