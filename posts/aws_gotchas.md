---
title: AWS Gotchas
description: My article description
tags: 'aws, gotchas, timestanps'
cover_image: ''
canonical_url: null
published: false
---
## AWS Gotchas

I will highlight AWS gotchas as I find them

### Dynamodb

#### TTL Fields are in Seconds
  TTL Fields on dynamodb are great, as they allow a grace period between marking a record for deletion and the actual deletion. Meaning that when you have finished with a record, you can set a TTL field to a time in the future and AWS internal mechanisms will remove the record at some point soon after the that time has passed.

##### Gotcha:
 The TTL field is an integer in **seconds** from the Unix epoch, all other dates, including explicit date fields in dynamodb are stored as ISO dates, which are stored under the hood as **microseconds** from the Unix epoch. This is documented at [Using DynamoDB Time to Live (TTL)](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-before-you-start.html#time-to-live-ttl-before-you-start-formatting). However, it is easy to forget hence the reason for this gotcha.

##### Workaround:
Calculate the TTL using your standard date library, convert to integer and divide by 1000 to convert milliseconds to seconds.
e.g
```javascript
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
const dynamoDb = new DocumentClient()

const hoursInTheFuture = 24

const timeInSeconds = () => {
  const time = new Date()
  const hours = time.getHours() + hoursInTheFuture

  time.setHours(hours)

  return Math.round(time.getTime() / 1000)
}

export const deleteInTheFuture = async (id) => {
  const result = await dynamoDb.update({
    TableName: 'myDynamoDbTable',
    Key: {
      id
    },
    UpdateExpression: 'SET ttl = :t',
    ExpressionAttributeValues: {
      ':t': timeInSeconds() //record will be deleted momentarily from now
    }

  }).promise()

  return result
}
```
