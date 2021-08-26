# Apollo Elements Todo App

Todo app written with [Apollo Elements](https://apolloelements.dev/blog/todo-app/).

## Getting Started

```bash
git clone git@github.com:apollo-elements/todo-app.git
cd todo-app
npm ci
npm start
```

## The Server

The Todo list is served via a [koa](https://koajs.com/) middleware. `npm start` runs [web-dev-server](https://modern-web.dev/guides/dev-server/getting-started/) with the middleware already applied. The todo-list is held in-memory, restarting the server resets it to the hardcoded defaults.

## The Client

The client code uses [Apollo Elements](https://apolloelements.dev), [lit](https://lit.dev) and [Shoelace](https://shoelace.style) to render GraphQL queries and mutations for TODO <abbr title="create read update delete">CRUD</abbr> operations.
