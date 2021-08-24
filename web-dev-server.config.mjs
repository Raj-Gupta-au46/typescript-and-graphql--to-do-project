import { esbuildPlugin } from '@web/dev-server-esbuild';
import { fromRollup } from '@web/dev-server-rollup';
import { graphqlTodoPlugin } from './server.js';
import { resolveCodegenPlugin } from '@apollo-elements/create/helpers.js';

import _litcss from 'rollup-plugin-lit-css';

const litcss = fromRollup(_litcss);

export default {
  nodeResolve: true,
  port: 8004,
  appIndex: 'index.html',
  rootDir: '.',
  mimeTypes: {
    'src/components/**/*.css': 'js',
  },
  plugins: [
    esbuildPlugin({ ts: true }),
    resolveCodegenPlugin({ ts: true }),
    graphqlTodoPlugin(),
    litcss({
      include: 'src/components/**/*.css',
      exclude: 'src/style.css',
    }),
  ],
};
