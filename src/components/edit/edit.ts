import { LitElement, html, TemplateResult } from 'lit';
import { ApolloMutationController } from '@apollo-elements/core';
import { customElement, property, query, state } from 'lit/decorators.js';

import { go } from '../../router';

import { AppQuery } from '../app/App.query.graphql';
import { DeleteTodo } from './DeleteTodo.mutation.graphql';
import { UpdateTodo } from './UpdateTodo.mutation.graphql';
import { todoFragmentDoc } from '../todo.fragment.graphql';

import style from './edit.css';
import shared from '../shared.css';

declare global { interface HTMLElementTagNameMap { 'todo-edit': UpdateTodoElement } }

@customElement('todo-edit')
export class UpdateTodoElement extends LitElement {
  static readonly is = 'todo-edit';

  static readonly styles = [shared, style];

  @state() loading = false;

  /** Updates a Todo Item's name or complete state */
  mutation = new ApolloMutationController(this, UpdateTodo, {
    /** Updates the local cached copy of the Todo item in all components that query for it */
    update: (cache, result) =>
      cache.writeFragment({
        fragment: todoFragmentDoc,
        id: cache.identify({ __typename: 'Todo', id: this.todoId }),
        data: result.data.updateTodo,
      }),
  });

  @property({ attribute: 'data-id' }) todoId?: string;
  @property({ attribute: 'data-name' }) todoName?: string;
  @property({ attribute: 'data-complete', type: Boolean }) complete?: boolean;

  @query('sl-input') input: HTMLInputElement;
  @query('sl-checkbox') checkbox: HTMLInputElement;

  render(): TemplateResult {
    const loading = this.loading || this.mutation.loading;
    return html`
      <!-- Sets the 'name' input field. Hitting 'Enter' fires the mutation -->
      <sl-input label="To-Do Item"
                value="${this.todoName}"
                @keyup="${event => event.key === 'Enter' && this.mutate()}"
                ?disabled="${loading}"></sl-input>

      <!-- Sets the 'complete' input field. Toggling fires the mutation -->
      <sl-checkbox ?checked="${this.complete}"
                   ?disabled="${loading}"
                   @sl-change="${e => this.mutate()}">Complete</sl-checkbox>

      <!-- Clicking fires a mutation that deletes the Todo Item -->
      <sl-button type="danger" @click="${this.deleteTodo}">Delete Todo</sl-button>
    `;
  }

  /** Gets the operation's input fields from the UI then updates the Todo item */
  mutate(): void {
    this.mutation.mutate({
      variables: {
        input: {
          todoId: this.todoId,
          name: this.input.value,
          complete: this.checkbox.checked,
        },
      },
    });
  }

  /** Imperatively deletes a Todo item */
  private async deleteTodo(): Promise<void> {
    const { todoId } = this;
    // 1: set loading state
    this.loading = true;
    try {
      // 2: call the mutation imperatively
      await this.mutation.client.mutate({
        mutation: DeleteTodo,
        variables: { input: { todoId } },
        /**
         * 3: The mutation returns the updated list of todos.
         * Overwriting the todos array causes the cache GC
         * To remove the missing entry.
         */
        update(cache, result) {
          const query = AppQuery;
          const variables = { todoId };
          cache.writeQuery({
            query,
            variables,
            data: {
              ...cache.readQuery({ query, variables }),
              todos: result.data.deleteTodo,
            },
          });
        },
      });
      // 4: navigate back to the list
      await go('/');
    } finally {
      // clean up loading state.
      this.loading = false;
    }
  }
}
