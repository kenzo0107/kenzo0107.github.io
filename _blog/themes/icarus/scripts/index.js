/* global hexo */
const logger = require('hexo-log')();

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
  return `<div class="level link-preview">
  <div class="og-image">
    <a href="${amazon_url}" target="_blank" >
      <img src="${img_url}" style="border: none;" />
    </a>
  </div>
  <div class="og-description">
    <div>
      <a href="${amazon_url}" target="_blank" >${title}</a>
    </div>
    <div>&nbsp;</div>
    <div class="og-description">
      <a class="button is-link" href="${rakuten_url}" target="_blank" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" style="background:#f76956">楽天市場でチェック</a>
      <a class="button is-link" href="${amazon_url}" target="_blank" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" style="background:#ff9900">Amazonでチェック</a>
    </div>
  </div>
</div>`;
});
