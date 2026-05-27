// src/tools/index.ts
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
import { updateBlockTool } from "./gutenberg-blocks.js";

// Use any[] because most existing tools use JSON Schema,
// while blocks.ts now uses Zod for MCP SDK compatibility.
export const allTools: any[] = [
  ...unifiedContentTools,
  ...unifiedTaxonomyTools,
  ...pluginTools,
  ...mediaTools,
  ...userTools,
  ...pluginRepositoryTools,
  ...commentTools,
  ...sqlQueryTools,
  ...siteManagementTools,
  ...blockTools,
  updateBlockTool,
];

export const toolHandlers: any = {
  ...unifiedContentHandlers,
  ...unifiedTaxonomyHandlers,
  ...pluginHandlers,
  ...mediaHandlers,
  ...userHandlers,
  ...pluginRepositoryHandlers,
  ...commentHandlers,
  ...sqlQueryHandlers,
  ...siteManagementHandlers,
  ...blockHandlers,
  update_block_by_name: updateBlockTool.execute,
};
