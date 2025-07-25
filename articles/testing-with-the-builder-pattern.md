---
title: Testing With The Builder Pattern
description: Using the builder pattern to create well maintained tests and eliminating some test anti-patterns
tags: ''
cover_image: ''
series: 'Testing'
canonical_url: null
published: true
---

## A Story about the Mystery Guest

I remember the conversation well, sitting down with my colleague for a pairing session on my first day working on an unfamiliar code base, opening up a test file and looking at the tests around the feature we where tasked with modifying.

Me:
> Why is this test asserting this value?
> where is the data coming from?

Colleague:
> Oh, its coming from the 21st fixture file, line 453

Me:
> Wow, good memory!
> and how is it being loaded into the test file?

Colleague:
> I don't know. I think there is some boot-strapping done by the test runner.

The conversation continued along the lines of how the fixtures where periodically generated and how inconvenient they where to maintain.

A classic example of The Mystery Guest anti-pattern. A pattern where we don't know where the test data is coming from and how it is affecting the outcome of the test. A pattern that adds fragility and breaks the concept of tests as documentation.

```mermaid
flowchart LR
    subgraph A[Arrange]
        direction LR
        D["❓<br>Mysterious Data Source<br>❓<br>(e.g., large fixture file, database)"]
    end

    subgraph B[Act]
      E[Call the function or method under test]
    end

    subgraph C[Assert]
       F[Compare actual vs. expected<br><b>Why did it pass/fail?</b>]
       G[Broken Code]
       H[Bad Data]
       F-->G
       F-->H
   end

    A --> B
    B --> C
```

## How can we write good tests?

A good test follows these principles:
- Documents the behavior of a feature.
- Introduces no logic other than what is contained in the feature under test.
- Describes clearly what, given the input, the output should be.
- Independent of other tests.
- Responsible for it's own setup and teardown.

These last 3 points are what this article focuses on.

```mermaid
  flowchart LR

    subgraph A[Arrange]
      D[Create Test Data]
      E[Create Expected Result]
    end

    subgraph B[Act]
      F[Call the function or method under test]
    end

    subgraph C[Assert]
      G[Compare actual vs. expected<br><b>Why did it pass/fail?</b>]
      H[Broken Code]
      G-->H
    end
    A --> B
    B --> C
```

We could simply write tests that use raw data, and meet the requirements of a good test. However with complex data, this will soon get unwieldy and could cause a maintenance nightmare should the shape of the data change.

```typescript
export interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  taxRate: number;
}

export function calculateTotalPrice(cart: Cart): number {
  const subtotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  return subtotal * (1 + cart.taxRate);
}

// Test for calculateTotalPrice

test('should calculate the total price with tax', () => {
  // Arrange: Create the test data directly in the test
  const cart: Cart = {
    items: [
      { name: 'Apple', price: 1.0, quantity: 2 },
      { name: 'Banana', price: 0.5, quantity: 3 },
    ],
    taxRate: 0.1, // 10% tax
  };

  // Expected Result
  // (2 * 1.0) + (3 * 0.5) = 2.0 + 1.5 = 3.5
  // 3.5 * 1.1 = 3.85
  const expected = 3.85
  // Act: Call the function under test

  const totalPrice = calculateTotalPrice(cart);

  // Assert: Check the result
  expect(totalPrice).toBe(expected);
});
```

## Introducing the Builder Pattern

The builder pattern allows for a way of meeting the requirements of a good test and provides the following:
- Sensible defaults
- Future proofing - if the shape of the data changes the tests don't have to
- Required data guard - If the wider functionality requires specific data to be present, whilst the test doesn't, then the test wont fail

There are a number of ways of implementing the builder pattern in the JavaScript/TypeScript eco-system. However the implementation that works for my use case takes advantage of both the object oriented paradigm and the code generation that my IDE gets from using TypeScript.

```typescript
export abstract class AbstractDataBuilder<T> {
  private data!: Partial<T>;

  with<K extends keyof T>(key: K, value: T[K] | undefined) {
    this.data[key] = value;
    return this;
  }

  get build(): Partial<T> {
    return Object.freeze(this.data);
  }
}
```

When this abstract class is extended, an interface or type `T` must be specified, this allows for type hinting and code completion in the IDE. The `Partial`  allows testing data where some attributes might be missing. The `build` method allows for the data to be returned and used without pollution from the instantiated builder class. The `with` method returns `this` so we can chain calls to the builder.

Implementing a builder for the interfaces/types we are testing against looks like:

```typescript
import { AbstractDataBuilder } from '../libs/abstract-data-builder'
import { Cart, CartItem } from './cart.types'

export class CartItemBuilder extends AbstractDataBuilder<CartItem> {
  constructor() {
    super();
    this.data = {
      //keys generated by the IDE
      name: 'some item',
      price: 0.0,
      quantity: 0,
    };
  }
}

export class CartBuilder extends AbstractDataBuilder<Cart> {
  constructor() {
    super();
    this.data = {
      //keys generated by the IDE
      items: [],
      taxRate: 0.1
    };
  }
}
```

Now we can change our test code:
```typescript
import { Cart, CartItem } from './cart.types';
import { CartBuilder, CartItemBuilder } from './cart.builders';
import { calculateTotalPrice } from './cart';

// Test for calculateTotalPrice
test('should calculate the total price with tax', () => {
  // Arrange: Create the test data using the builder
  //We could have production scenarios where data is missing.
  //Inform TypeScript that the Partial data we generated for the test is complete.
  const item1 = new CartItemBuilder()
    .with('price', 1.0)
    .with('quantity', 2)
    .build as CartItem;

  const item2 = new CartItemBuilder()
    .with('price', 0.5)
    .with('quantity', 3)
    .build as CartItem;


  const cart = new CartBuilder()
    .with('items', [item1, item2])
    .with('taxRate', 0.1)
    .build as Cart;

  // Expected Result
  // (2 * 1.0) + (3 * 0.5) = 2.0 + 1.5 = 3.5
  // 3.5 * 1.1 = 3.85
  const expected = 3.85

  // Act: Call the function under test
  const totalPrice = calculateTotalPrice(cart);

  // Assert: Check the result
  expect(totalPrice).toBe(expected);
});
```

**N.B** We no longer include the item names as we don't need them to get the result, and there is a default value for `name`, any guard that checks for the presence of `name` wont cause the test to fail. Here we are explicitly changing the values that we care about.

### Problems

Whilst this way of using the builder generally works, there are some issues:

#### Not Future Proof

The `CartBuilder` is expecting an `Array` of items. What if the underlying data structure was changed to a `Map` or `Set`? This means our tests are not future proof.

This issue can be handled by adding an extra function `withItem` to the concrete class, allowing the data structure to change without changing the tests.

```typescript
export class CartBuilder extends AbstractDataBuilder<Cart> {
  constructor() {
    super();
    this.data = {
      //keys generated by the IDE
      items: [],
      taxRate: 0.1
    };
  }

  //expose a method to add items to attributes with complex types
  //allowing the complex type to change in the future.
  withItem(item: CartItem){
    this.data!.items!.push(item);
    return this;
  }
}

// Test for calculateTotalPrice
test('should calculate the total price with tax', () => {
  // Arrange: Create the test data using the builder
  const item1 = new CartItemBuilder()
    .with('price', 1.0)
    .with('quantity', 2)
    .build as CartItem;

  const item2 = new CartItemBuilder()
    .with('price', 0.5)
    .with('quantity', 3)
    .build as CartItem;

  const cart = new CartBuilder()
    .withItem(item1)
    .withItem(item2)
    .with('taxRate', 0.1)
    .build as Cart;

  // Expected Result
  // (2 * 1.0) + (3 * 0.5) = 2.0 + 1.5 = 3.5
  // 3.5 * 1.1 = 3.85
  const expected = 3.85
  // Act: Call the function under test

  const totalPrice = calculateTotalPrice(cart as Cart);

  // Assert: Check the result
  expect(totalPrice).toBe(expected);
});

```

#### Explicit vs Implicit undefined

What if we need to have missing data for a test? Currently we would need to use
```typescript
const item = new CartItemBuilder()
    .with('price', 0.5)
    .with('quantity', 3)
    .with('name', undefined)
    .build;
```
this currently will return an object with an explicit undefined:
```json
{
  "name": undefined,
  "price": 0.5,
  "quantity": 3
}
```
Some test frameworks treat this differently to an implicit undefined, giving unexpected and hard to debug results:
```json
{
  "price": 0.5,
  "quantity": 3
}
```
We can resolve this by adding a `delete` method to the `AbstractDataBuilder`:
```typescript
export abstract class AbstractDataBuilder<T> {
  private data!: Partial<T>;

  with<K extends keyof T>(key: K, value: T[K]) {
    this.data[key] = value;
    return this;
  }

  delete<K extends keyof T>(key: K) {
    delete this.data[key];
    return this;
  }

  get build(): Partial<T> {
    return Object.freeze(this.data);
  }
}

```
#### Same default data

Whilst running `TDD` tests with Data Builders in this way we probably wont see `Test Bleed`, a problem where the state of one test affects the state of another. We may see it when running integration tests, breaking the `Independent of other tests` principle.

To fix this we can add random data to the concrete builder classes. In this case using [faker](https://www.npmjs.com/package/@faker-js/faker).

```typescript
import { faker } from '@faker-js/faker';
import { AbstractDataBuilder } from '../libs/abstract-data-builder'
import { CartItem } from './cart.types'

export class CartItemBuilder extends AbstractDataBuilder<CartItem> {
  constructor() {
    super();
    this.data = {
      //keys generated by the IDE, values are random
      name: faker.food.fruit(),
      price: faker.number.float({ min: 0, max: 100, multipleOf: 0.01 }),
      quantity: faker.number.int({ min: 0, max: 100 }),
    };
  }
}

```

## Where should Data Builders Live ?

Ideally Data Builders should be stored alongside the Classes, Interfaces and Types they represent. This allows for quick updates without having to navigate through multiple folders, and allowing for [Seperation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns).

The examples shown use this folder structure
```tree
├── package.json
├── package-lock.json
├── Readme.md
├── tsconfig.json
└── src
    ├── libs
    │   └── abstract-data-builder.ts
    └── cart
      ├── cart.ts
      ├── cart.builder.ts
      ├── cart.types.ts
      └── cart.test.ts
```

## Exporting Non-JSON data from Builders

All the examples so far are exporting data as JSON, the default for the JavaScript eco-system. What if we wanted some other format? Potentially we might want to test `grahpql`, `string`, `xml`, `yaml` or some other JSON structure.

```typescript
export class CartItemBuilder extends AbstractDataBuilder<CartItem> {
  constructor() {
    super();
    this.data = {
      //keys generated by the IDE
      name: 'some item',
      price: 0.0,
      quantity: 0,
    };
  }

  get string():string {
    return JSON.stringify(this.data);
  }

  get xml():string {
    //custom xml generator
  }
}
```

## Conclusion

The Builder Pattern, if used correctly, provides a clean, powerful, extensible and reusable way of generating test data, allowing us to follow the principles of good testing.

It can be used effectively across all levels of automated testing, and it can be used to generate partial data.

Most importantly by using this pattern, we can eliminate the Mystery Guest anti-pattern and the overhead of maintaining large collections of fixtures. Should the structure of the data change, the blast-radius is kept to a minimum.

## A (Future) Story about the Builder Pattern

I remember the conversation well, sitting down with my colleague for a pairing session on my first day working on an unfamiliar code base, opening up a test file and looking at the tests around the feature we where tasked with modifying.

Me:
> Why is this test asserting this value?
> where is the data coming from?

Colleague:
> It's the behavior of the function we are testing.
> The data is coming from an instantiation of a Builder Class, where we use sensible defaults and override the data that we care about.

Me:
> Wow, thats impressive!
> and how is it being loaded into the test file?

Colleague:
> The Builder Class is imported just like any other dependency, and is stored and updated alongside the schema it represents.
> The instantiation and overrides happen within each test, and as the defaults are randomized, we have mitigated against `Test Bleed`

The conversation continued along the lines of how the builders where easy to maintain, and when the data structures change the affects are minimal.
