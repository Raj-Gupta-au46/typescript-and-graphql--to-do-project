/* eslint-env node */
/* eslint-disable no-console */

import { ApolloServer } from 'apollo-server-koa';

import { readFileSync } from 'fs';

let TODOS;

const INITIAL_TODOS = [
  { id: '0', name: 'Get Milk', complete: false },
  { id: '1', name: 'Get Bread', complete: false },
  { id: '2', name: 'Try to Take Over the World', complete: false },
];

function initTodos() {
  TODOS = [...INITIAL_TODOS];
}

function byId(id) {
  return x => x.id === id;
}

function getNextId() {
  const last = TODOS.map(x => x.id).sort().pop();
  return (parseInt(last ?? '-1') + 1).toString();
}

async function randomSleep(max = 800) {
  await new Promise(r => setTimeout(r, Math.random() * max));
}

initTodos();

const server = new ApolloServer({
  typeDefs: readFileSync(new URL('schema.graphql', import.meta.url), 'utf-8'),
  context: {
    getTodo(id) {
      const todo = TODOS.find(byId(id));
      if (!todo)
        throw new Error(`TODO ${id} not found`);
      return todo;
    },

    async getTodos() {
      await randomSleep();
      return TODOS;
    },

    async addTodo({ name, complete }) {
      await randomSleep();
      const todo = { id: getNextId(), name, complete };
      TODOS.push(todo);
      return todo;
    },

    async updateTodo({ id, name, complete }) {
      await randomSleep();
      const todo = server.context.getTodo(id);
      todo.name = name ?? todo.name;
      todo.complete = complete ?? todo.complete;
      return todo;
    },

    async deleteTodo(id) {
      await randomSleep();
      server.context.getTodo(id);
      TODOS = TODOS.filter(x => x.id !== id);
      return TODOS;
    },
  },
  resolvers: {
    Query: {
      async todo(_, { todoId }, context) {
        await randomSleep();
        return todoId ? context.getTodo(todoId) : null;
      },
      async todos(_, __, context) {
        return context.getTodos();
      },
    },
    Mutation: {
      async createTodo(_, { input: { name, complete = false } }, context) {
        return context.addTodo({ name, complete });
      },
      async updateTodo(_, { input: { todoId, name, complete } }, context) {
        return context.updateTodo({ id: todoId, name, complete });
      },
      async toggleTodo(_, { todoId }, context) {
        const todo = await context.getTodo(todoId)
        return context.updateTodo({ ...todo, complete: !todo.complete });
      },
      async deleteTodo(_, { input: { todoId } }, context) {
        await context.deleteTodo(todoId);
        return context.getTodos();
      },
    },
  },
});

export function graphqlTodoPlugin() {
  return {
    name: 'graphql-todo-plugin',
    async serverStart({ app, config }) {
      await server.start();
      server.applyMiddleware({ app });
      console.log(`🚀 GraphQL Dev Server ready at http://localhost:${config.port}${server.graphqlPath}`);
    },
  };
}
