const axios = require('axios');
const config = require('config');

const createSiteMap = async ({ host }) => {
  try {
    const response = await axios.post(
      `${config.seoServiceBaseUrl}/sitemap`,
      {
        host,
      },
      {
        timeout: 5000,
      },
    );

    return response?.data ?? '';
  } catch (error) {
    return '';
  }
};

const addSitemapPost = async ({ host, author, permlink }) => {
  try {
    const response = await axios.post(
      `${config.seoServiceBaseUrl}/sitemap/post`,
      {
        host,
        author,
        permlink,
      },
      {
        timeout: 5000,
      },
    );

    return response?.data ?? '';
  } catch (error) {
    return '';
  }
};

const deleteSitemap = async ({ host }) => {
  try {
    const response = await axios.delete(
      `${config.seoServiceBaseUrl}/sitemap`,
      {
        data: {
          host,
        },
        timeout: 5000,
      },
    );

    return response?.data ?? '';
  } catch (error) {
    return '';
  }
};

const deleteCachedPages = async ({ host }) => {
  try {
    const response = await axios.delete(
      `${config.seoServiceBaseUrl}/cache-page`,
      {
        data: {
          host,
        },
        timeout: 5000,
      },
    );

    return response?.data ?? '';
  } catch (error) {
    return '';
  }
};

const sitemap = {
  createSiteMap,
  deleteSitemap,
  addSitemapPost,
};

const pages = {
  deleteCachedPages,
};

module.exports = {
  sitemap,
  pages,
};
