// src/tools/index.ts
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { unifiedContentTools, unifiedContentHandlers } from './unified-content.js';
import { unifiedTaxonomyTools, unifiedTaxonomyHandlers } from './unified-taxonomies.js';
import { pluginTools, pluginHandlers } from './plugins.js';
import { mediaTools, mediaHandlers } from './media.js';
import { userTools, userHandlers } from './users.js';
import { pluginRepositoryTools, pluginRepositoryHandlers } from './plugin-repository.js';
import { commentTools, commentHandlers } from './comments.js';
import { sqlQueryTools, sqlQueryHandlers } from './sql-query.js';
import { siteManagementTools, siteManagementHandlers } from './site-management.js';
import { blockTools, blockHandlers } from './blocks.js';

// Combine all tools - significantly reduced from ~65 to ~42 tools
export const allTools: Tool[] = [
  ...unifiedContentTools,
  ...unifiedTaxonomyTools,
  ...pluginTools,
  ...mediaTools,
  ...userTools,
  ...pluginRepositoryTools,
  ...commentTools,
  ...sqlQueryTools,
  ...siteManagementTools,
  ...blockTools
];

// Combine all handlers
export const toolHandlers = {
  ...unifiedContentHandlers,
  ...unifiedTaxonomyHandlers,
  ...pluginHandlers,
  ...mediaHandlers,
  ...userHandlers,
  ...pluginRepositoryHandlers,
  ...commentHandlers,
  ...sqlQueryHandlers,
  ...siteManagementHandlers,
  ...blockHandlers
};
