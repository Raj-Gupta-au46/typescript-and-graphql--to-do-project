import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';

import { locationVar } from './router';

export const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          location: {
            read() {
              return locationVar();
            },
          },
          todos: {
            /** overwrite previous array when updating todos. */
            merge(_prev, next) {
              return next;
            },
          },
        },
      },
    },
  }),
});
