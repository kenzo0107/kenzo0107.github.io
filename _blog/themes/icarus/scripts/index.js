/* global hexo */
const createLogger = require('hexo-log');

const logger = createLogger.default();

/**
 * Print welcome message
 */
logger.info(`=======================================
 ██╗ ██████╗ █████╗ ██████╗ ██╗   ██╗███████╗
 ██║██╔════╝██╔══██╗██╔══██╗██║   ██║██╔════╝
 ██║██║     ███████║██████╔╝██║   ██║███████╗
 ██║██║     ██╔══██║██╔══██╗██║   ██║╚════██║
 ██║╚██████╗██║  ██║██║  ██║╚██████╔╝███████║
 ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
=============================================`);

/**
 * Check if all dependencies are installed
 */
require('../include/dependency')(hexo);

/**
 * Configuration file checking and migration
 */
require('../include/config')(hexo);

/**
 * Register Hexo extensions and remove Hexo filters that could cause OOM
 */
require('../include/register')(hexo);

hexo.extend.tag.register('affiliate', function (args) {
  const title = args[0];
  const img_url = args[1];
  const amazon_url = args[2];
  const rakuten_url = args[3];
  return `<div class="affiliate-card" style="display:flex;align-items:flex-start;gap:1em;margin:1.5em 0;padding:1em;border:1px solid #e4e9ee;border-radius:8px;">
    <div style="flex:0 0 auto;">
      <a href="${amazon_url}" target="_blank" rel="nofollow"><img src="${img_url}" style="border:none;display:block;max-width:120px;height:auto;" /></a>
    </div>
    <div style="flex:1 1 auto;min-width:0;">
      <div style="font-weight:600;line-height:1.4;margin-bottom:0.6em;">
        <a href="${amazon_url}" target="_blank" rel="nofollow">${title}</a>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5em;">
        <a class="button is-link" href="${amazon_url}" target="_blank" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" style="background:#ff9900">Amazonでチェック</a>
        <a class="button is-link" href="${rakuten_url}" target="_blank" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" style="background:#f76956">楽天市場でチェック</a>
      </div>
    </div>
  </div>`;
});
