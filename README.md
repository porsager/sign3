# sign3

Create pre-signed S3 URLs

```js

import sign from 'sign3'

sign('https://accessKey:secretKey@endpoint').get(bucket, key, expiry, headers)
// returns a presigned get url for download

sign('https://accessKey:secretKey@endpoint').put(bucket, key, expiry)
// returns a presigned put url for upload

```
