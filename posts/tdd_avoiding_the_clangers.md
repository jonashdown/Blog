'''---
canonical_url: null
cover_image: https://raw.githubusercontent.com/jonashdown/Blog/main/_pngs/clangers.jpg
description: "How to avoid the clangers in test-driven development"
published: true
tags: TDD, clangers
title: TDD - Avoiding the Clangers
---

Test-Driven Development, when done correctly, will provide the following benefits to any development team and organization:

- Direction in coding.
- Documentation.
- Ongoing proof that software continues to work.
- Succinct, high-quality code.
- Fewer bugs.
- Confidence in the codebase.

If done incorrectly, we could have a clanger, which could manifest as a bug in the future.

## Basic Theory

Write a failing test, write enough code to make the test pass, refactor, and repeat.

The key thing to note here is the failing test. If the test passes, then either the test is wrong, or the requirement of the test has already been met. At this point, we should check that there isn't an existing test that covers the requirement and make a decision to keep or discard the new test; however, we don't need to write any code.

This can be visualized in the TDD Cycle:

![diagram](https://raw.githubusercontent.com/jonashdown/Blog/main/_pngs/tdd_avoiding_the_clangers-1.png)

## Advanced Theory

There are several levels of testing, most of which can be automated. Whilst unit tests cover the code, higher-level tests might cover business logic, accessibility, or data flows across large systems.

### The Pyramid of Testing

The pyramid of testing conceptually arranges these testing levels with manual testing at the top of the pyramid, end-to-end testing (where we test the full system), followed by integration testing (where we test some of the system and mock dependencies between services), and finally, unit testing (where we test the code and mock clients to services).

![diagram](https://raw.githubusercontent.com/jonashdown/Blog/main/_pngs/tdd_avoiding_the_clangers-2.png)

As we go up the pyramid, any bugs that we find become more expensive. A bug found at the unit-test level might take an hour or so of developer time to fix, whilst bugs found at the very top of the pyramid could result in lost sales, lost trust, or, if we breach GDPR laws, £20 million fines and prison sentences.

## Clangers

### Write Code with No Tests

___Good Luck!___ This is a very quick way to deliver overly complex solutions, introduce bugs and other tech debt, and have unmaintainable code.

### Write Code and Then Write Tests

This is not much better than writing code with no tests. It doesn't really consider either the business logic or the existing code. It only proves that the code that has just been written works, but there is no guarantee.

Often, when this happens, a new (cancelable) piece of work is created to write the tests.

### Treat BDD and TDD as Opposing Methods

TDD without BDD proves that the code works and will help keep the codebase simple, but there is no proof that we have built the right thing.

BDD without TDD proves the feature is correct, but debugging will be difficult.

BDD and TDD should be considered complementary, with BDD describing the feature (what) and TDD describing the implementation (how).


![diagram](https://raw.githubusercontent.com/jonashdown/Blog/main/_pngs/tdd_avoiding_the_clangers-3.png)

### Test for the Presence of a Function

```typescript
// Useless test
test('there is a function called area', () => {
  expect(typeof area).toEqual('function');
});

// Useful test
test('area returns 0 when the first argument is 0', () => {
  expect(area(0, 1)).toEqual(0);
});
```

If we are extending classes or implementing an interface, then either the IDE, the linter, or any type checker will pick this up.
The tests that we really care about are those that exercise the functionality of `area`. If the function does not exist or gives an incorrect result, we will get a test fail!

```typescript
// Useful test
test('area returns 0 when the first argument is 0', () => {
  expect(area(0, 1)).toEqual(0);
});
```

### Tests That Test Themselves

```typescript
test('area returns 1 when the arguments are both 1', () => {
  const expected = 1;

  const result = 1;
  area(1,1);

  expect(result).toEqual(expected);
})
```

This is not always easy to spot in review. However, by adopting a test-first approach, we will get a passing test before we write code, which will highlight the problem.

### Mocking the Code Under Test

```typescript
// Production code
export const area = (x: number): number => {
  return 4 * (x * Math.pow(2, 0.5) * 0.25) * (x * Math.pow(2, 0.5) * 0.5)
}

// Tests
test('area() calculates and returns the correct value', () => {
  areaMock = mock(area)
  areaMock.returnValue(4)
  expect(areaMock(2)).to.equal(4)
})

test('area() calculates and returns the correct value', () => {
  areaMock = mock(area)
  areaMock.mockImplementation((x) => {
    return x * x;
  })
  expect(areaMock(2)).to.equal(4)
})
```

In both the above tests, `area` has been replaced with mocked functionality, meaning that the function is not actually tested, and any bugs in the implementation might never be found. Again, this is hard to spot in code review, but a test-first approach will uncover this.

```typescript
// Tests
test('area() calculates and returns the correct value', () => {
  const result = area(2);
  expect(result).to.equal(4);
});

// Production code
export const area = (x: number): number => {
  return 4 * (x * Math.pow(2, 0.5) * 0.25) * (x * Math.pow(2, 0.5) * 0.5)
}
```

### Mocking the Wrong Thing

```typescript
// Production code
const httpClient = new HttpClient()

export const goAndGetAResource = async () => {
  result = await httpClientWrapper()
  if(!result.success) {
    console.error('we got a 404')
  }
 }

const httpClientWrapper = async (): Promise<{ success: boolean, resource: unknown }> => {
  try {
    const resource = await httpClient.get('https://example.com/randomThing');
    return { success: true, resource };
  } catch (e) {
    return { success: true };
  }
}

// Tests
test('it logs when we get a 404', () => {
 const consoleMock = mock(console)
 httpClientWrapperMock = mock(httpClientWrapper)
 httpClientWrapperMock.resolvedValue({ success: false })
 await goAndGetAResource()
 expect(consoleMock.error).toBeCalledWith('we got a 404')
});
```

Here, mocking `httpClientWrapper` is not the correct thing to mock, as it is an implementation detail of `goAndGetAResource`. This has resulted in unnecessarily complex code, and the mock is actually hiding a bug; `httpClientWrapper` will never return `{ success: false }`.

The correct thing to mock is the `httpClient`, in particular, the `get` method.

```typescript
// Tests
const getMock = mock();
const HttpClientMock = mock(HttpClient);
HttpClientMock.returnValue({
  get: getMock
})

test('it logs when we get a 404', () => {
 const consoleMock = mock(console)
 const error = new Error();
 error.status = 404;

 getMock.rejectedValue(error);
 await goAndGetAResource();

 expect(consoleMock.error).toBeCalledWith('we got a 404')
});

// Production code
const httpClient = new HttpClient()

export const goAndGetAResource = async () => {
  try {
    result = await httpClient.get('https://example.com/randomThing');
  }
  catch (error) {
    if (error.status === 404) {
      console.error('we got a 404');
    }
  }
 }
```

### Not Testing Side Effects

```typescript
const renderPersonalData = async (name) => {
  try {
    result = await httpClient.get(`https://example.com/personalData/${name}`)
    // Side effect - where do the logs go, should anything be redacted?
    console.log({result})
    return render(result)
  }
  catch (e) {
    console.error(e)
  }
}
```

In an ideal world, we should avoid side effects wherever possible. If we must have side effects, then having tests for them indicates that they are intentional and handled correctly. In this example, we should assert that when either `console.log` or `console.error` are called, that any sensitive data is redacted.

### Not Resetting Mocks

```typescript
// Production code
const area = (x: number): number => {
  console.log(x);
  result = x * x;
  console.log(result);
  return result;
}

// Tests
const consoleMock = mock(console);

test('It logs the input', () => {
  area(4);
  expect(consoleMock.log).toBeCalledWith(4);
});

test('It logs the result', () => {
  area(2);
  expect(consoleMock.log).toBeCalledWith(4);
});
```

In this case, we have asserted that `console.log` has been called with the number 4, but is it the input of the first test or the result of the second test? Is it both?

```typescript
// Tests
const consoleMock = mock(console);

beforeEach(() => {
  resetAllMocks();
});

test('It logs the input', () => {
  area(4);
  expect(consoleMock.log).toBeCalledWith(4);
});

test('It logs the result', () => {
  area(2);
  expect(consoleMock.log).toBeCalledWith(4);
});

// Production code
const area = (x: number): number => {
  console.log(x);
  result = x * x;
  console.log(result);
  return result;
}
```

### Test Bleed

This is where the outcome of one test affects the next. Whilst not resetting mocks is an example, there are other types of test bleed, such as a shared result object across tests that is being modified.

```typescript
// Production code
const addUserRole = (user: User, role: string) => {
  user.roles.push(role);
}

const newUser = (name: string):User => ({
  name,
  roles:['reader']
});

// Tests
// Shared state that can be mutated
const user = newUser(Jon);

describe('user management', () => {
  test('should be able to add a role to a user', () => {
    addUserRole('author');
    expect(user.roles).toContain('author');
  });

  test('a new user should only have the reader role', () => {
    expect(user.roles).toEqual(['reader']);
  });
});
```
The second test will fail as the first test is mutating shared state. This can be identified by running the tests in a random order.

```typescript
// Tests
describe('user management', () => {
  test('should be able to add a role to a user', () => {
    const user = newUser('Bob');
    const { roles } = addUserRole('author');
    expect(roles).toContain('author');
  });

  test('a new user should only have the reader role', () => {
    const user = newUser('Jon');
    expect(user.roles).toEqual(['reader']);
  });
});

// Production code
const addUserRole = (user: User, role: string): User=> {
  const { roles } = user;
  roles.push(role);
  return {...user, roles}
}

const newUser = (name: string):User => ({
  name,
  roles:['reader']
});
```
### Synchronous Testing of Asynchronous Code

```typescript
// Production code
const httpClient = new HttpClient()

export const goAndGetAResource = async () => {
  try {
    result = await httpClient.get('https://example.com/randomThing');
  }
  catch (error) {
    if (error.status === 404) {
      console.error('we got a 404');
    }
  }
}
// Tests
test('should fetch a resource', () => {
  const getMock = mock();
  const HttpClientMock = mock(HttpClient);
  HttpClientMock.returnValue({ get: getMock });

  goAndGetAResource();

  expect(getMock).toBeCalledWith('https://example.com/randomThing');
});
```

What happens here is what usually happens when we call asynchronous functions in a synchronous way. That is, the next synchronous function will be called before the asynchronous function completes. As this is a test, the test run will complete before the assertion is checked.

```typescript
// Tests
test('should fetch a resource and wait for it to resolve', async () => {
  const getMock = mock();
  const HttpClientMock = mock(HttpClient);
  HttpClientMock.returnValue({ get: getMock });

  await goAndGetAResource();

  expect(getMock).toBeCalledWith('https://example.com/randomThing');
});

// Production code
const httpClient = new HttpClient()

export const goAndGetAResource = async () => {
  try {
    result = await httpClient.get('https://example.com/randomThing');
  }
  catch (error) {
    if (error.status === 404) {
      console.error('we got a 404');
    }
  }
}
```

### Unit Testing Infrastructure as Code

```typescript
// Production Code
export const createLambdaWithDynamoDBConfig = (functionName: string, tableName: string) => {
  const lambdaConfig = {
    FunctionName: functionName,
    Runtime: 'nodejs20.x',
    MemorySize: 128,
    Timeout: 30,
    Handler: 'index.handler',
    Role: `arn:aws:iam::123456789012:role/${functionName}Role`, // Reference to the IAM role
  };

  const dynamoDBTableConfig = {
    TableName: tableName,
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  };

  const iamRoleConfig = {
    RoleName: `${functionName}Role`,
    AssumeRolePolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole',
        },
      ],
    },
    Policies: [
      {
        PolicyName: `${functionName}DynamoDBWritePolicy`,
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem'],
              Resource: `arn:aws:dynamodb:us-east-1:123456789012:table/${tableName}`,
            },
          ],
        },
      },
    ],
  };

  return {
    lambda: lambdaConfig,
    dynamoDB: dynamoDBTableConfig,
    iamRole: iamRoleConfig,
  };
};

// Tests
test('should create the exact lambda and dynamodb configuration', () => {
  const functionName = 'my-data-processor';
  const tableName = 'my-data-table';

  const expectedConfig = {
    lambda: {
      FunctionName: functionName,
      Runtime: 'nodejs20.x',
      MemorySize: 128,
      Timeout: 30,
      Handler: 'index.handler',
      Role: `arn:aws:iam::123456789012:role/${functionName}Role`,
    },
    dynamoDB: {
      TableName: tableName,
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    },
    iamRole: {
      RoleName: `${functionName}Role`,
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        {
          PolicyName: `${functionName}DynamoDBWritePolicy`,
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem'],
                Resource: `arn:aws:dynamodb:us-east-1:123456789012:table/${tableName}`,
              },
            ],
          },
        },
      ],
    },
  };

  const actualConfig = createLambdaWithDynamoDBConfig(functionName, tableName);
  expect(actualConfig).toEqual(expectedConfig);
});
```
This is an extremely brittle test, which is testing the JSON output of our IaC function, not what is deployed to the cloud, nor the functionality we want (can the lambda write to the table?), and if any aspect of the infrastructure changes, this test will fail!

It would be better to simply delete this test and have an end-to-end test that asserts data is written to the DynamoDB table when the lambda is invoked.

## Avoiding the Clangers

- Start at the top of the pyramid of testing and work down.
- Work with stakeholders to define the requirements of a feature.
- Write requirements as tests.
- Make sure new tests fail before writing code.
- Consider writing tests as part of delivering a feature.
- Write unit tests only to implement requirements.
- Keep logic out of tests.
- Keep tests isolated.
- Express bugs as tests.
- Review tests.

---

- [Buy me a coffee](https://buymeacoffee.com/jonashdown)
- [Ko-fi](https://ko-fi.com/Y8Y1HG7Q3)
'''