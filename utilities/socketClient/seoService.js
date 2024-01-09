const axios = require('axios');

const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://www.waivio.com/seo-service'
  : 'https://waiviodev.com/seo-service';

const createSiteMap = async ({ host }) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/sitemap`,
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
      `${BASE_URL}/sitemap/post`,
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
      `${BASE_URL}/sitemap`,
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

module.exports = {
  sitemap,
};
