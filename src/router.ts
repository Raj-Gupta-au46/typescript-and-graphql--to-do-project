import { makeVar } from '@apollo/client/core';
import { installRouter } from 'pwa-helpers/router';
import { URLPattern } from 'urlpattern-polyfill';

const pattern = new URLPattern({
  pathname: '/todos/:todoId',
});

function makeLocation(location = window.location) {
  const { assign, reload, replace, toString, valueOf, ...rest } = location;
  return {
    ...rest,
    __typename: 'Location',
    todoId: pattern.exec(new URL(rest.href))?.pathname?.groups?.todoId ?? null,
  };
}

function update(location = window.location) {
  locationVar(makeLocation(location));
}

export const locationVar = makeVar(makeLocation());

export async function go(path: string): Promise<void> {
  history.pushState(null, 'next', new URL(path, location.origin).toString());
  await new Promise(r => requestAnimationFrame(r));
  update();
}

installRouter(update);
