import type SLDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog';

import { LitElement, html, TemplateResult } from 'lit';
import { ApolloMutationController, ApolloQueryController } from '@apollo-elements/core';
import { customElement, query, state } from 'lit/decorators.js';

import { AppQuery } from './App.query.graphql';
import { CreateTodo } from './CreateTodo.mutation.graphql';
import { ToggleTodo } from './ToggleTodo.mutation.graphql';

import '@apollo-elements/components/apollo-mutation';

import style from './app.css';
import shared from '../shared.css';

@customElement('apollo-app')
export class ApolloApp extends LitElement {
  static readonly is = 'apollo-app';
  static readonly styles = [shared, style];

  @state() view = '';
  @query('sl-input') input: HTMLInputElement;
  @query('#new-dialog') newDialog: SLDialog;

  /**
   * The main app query. Queries for
   *   - The list of todos
   *   - The current route, including the :todoId route param, if any
   *   - The specific route todo by ID, if any
   * Lazy-loads the edit component when the :todoId route param exists
   */
  query = new ApolloQueryController(this, AppQuery, {
    onData: data => {
      this.view = data?.location?.todoId ? 'edit' : 'list';
      if (this.view === 'edit')
        import('../edit');
    },
  });

  /** Creates a new Todo item. */
  mutation = new ApolloMutationController(this, CreateTodo, {
    /** Adds the new Todo item to the cache when the mutation resolves */
    update: (cache, result) => {
      const cached = cache.readQuery({
        query: AppQuery,
        returnPartialData: true,
      });
      cache.writeQuery({
        query: AppQuery,
        data: {
          todo: null,
          ...cached,
          todos: [
            ...cached.todos,
            result.data.createTodo,
          ],
        },
      });
    },
  });

  render(): TemplateResult {
    const todos = this.query.data?.todos ?? [];
    return html`
    <sl-card>
      <h2 slot="header">To-Do List</h2>
      <!-- Clicking the button opens a dialog to add a new Todo -->
      <sl-tooltip slot="header" content="Add Todo">
        <sl-icon-button name="plus-circle"
                        label="Add Todo"
                        @click="${this.openDialog}"></sl-icon-button>
      </sl-tooltip>

      <!-- The main todo list -->
      <ol>${todos.map(({ name, id, complete }) => html`
        <li>
          <!-- Clicking the button fires the 'ToggleTodo' mutation -->
          <apollo-mutation data-todo-id="${id}"
                           .mutation="${ToggleTodo}"
                           .optimisticResponse="${{ toggleTodo: { __typename: 'Todo', complete: !complete, id, name } }}">
            <sl-icon-button trigger name="${complete ? 'check-square' : 'square'}"></sl-icon-button>
          </apollo-mutation>
          <a href="/todos/${id}">${name}</a>
        </li>`)}
      </ol>
    </sl-card>

    <sl-card ?hidden="${this.view !== 'edit'}">
      <h2 slot="header">Edit Todo</h2>
      <sl-icon-button slot="header" name="x" label="Close" href="/"></sl-icon-button>
      <todo-edit data-id="${this.query.data?.todo?.id}"
                 data-name="${this.query.data?.todo?.name}"
                 ?data-complete="${this.query.data?.todo?.complete}"
                 ?hidden="${this.view !== 'edit'}"></todo-edit>
    </sl-card>

    <sl-dialog id="new-dialog"
               label="New To-Do Item"
               @sl-initial-focus="${this.onDialogOpen}">
      <sl-input ?disabled="${this.mutation.loading}" @keyup="${this.onKeyup}"></sl-input>
      <sl-button slot="footer" @click="${this.addTodo}">Add Todo</sl-button>
    </sl-dialog>
    `;
  }

  private openDialog() {
    this.newDialog.show();
  }

  private onKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter')
      this.addTodo();
  }

  private async addTodo() {
    try {
      await this.mutation.mutate({
        variables: { input: { name: this.input.value } },
      });
      this.input.value = '';
      this.input.blur();
      this.newDialog.hide();
    } catch (e) {
      console.error(e);
    }
  }

  private onDialogOpen(event: Event) {
    event.preventDefault();
    this.input.focus();
  }
}
