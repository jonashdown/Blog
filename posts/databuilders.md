# Data Builders and testing

## What problem do they solve ?

### Fixtures
 - Avoids the mystery guest Anti-pattern
 - Avoids having to keep lots of fixture files up to date.

### Testing
 -- Allow each test to be responisble for setup and teardown.
 -- Avoid edge cases due to missing or incorrect data.
 -- Encapuslate data model, and allows it to be altered

## What are they ?
 - A set of sensible defaults
 - Encapuslate data model, and allows it to be altered
 - Provide methods to override defaults
 - Chainable
 - Extensible
 - Evolve with data
 - Aware of the data shape

## What they are not
 - Not a silver bullet
 - Not Generic - just use JSON within the code.

## Examples

```js
export const personBuilder = () => {
  const builder = {
    data: {
      firstname: generateRandomFirstName(),
      lastname: genereateRandomLastName(),
      id: uuid()
      dob: generateRandomDate(),
      friends: 'Bob, Charlie, Emma'
    },
    getData: () => data,
    withFirstName: (name) => {
      data.firstname = name
      return builder
    },
    withLastName: (name) => {
      data.lastname = name
      return builder
    },
    withDob: (date) => {
      data.dob = date
      return builder
    },
    withoutId: () => {
      delete data.id
      return builder
    },
    withFriends: (arrayOfFriends) => {
      data.friends = arrayOfFriends.toString()
      return builder
    },
    withNestedFavsColor: (colr) => {
      data.favourites.color = colr
      return builder
    },
    withNestedFavsCar: (car) => {
      data.favourites.car = car
      return builder
    },
    with(key, value) => {
      data[key] = value
      return builder
    }
  }

  return builder
}
