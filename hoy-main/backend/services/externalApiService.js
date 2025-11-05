const axios = require('axios');

// Example function to fetch products from an external API
const fetchProductsFromExternalApi = async (apiUrl, apiKey = '') => {
    try {
        const config = {};
        if (apiKey) {
            config.headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
        }
        
        const response = await axios.get(apiUrl, config);
        return response.data;
    } catch (error) {
        console.error('Error fetching from external API:', error.message);
        throw new Error(`Failed to fetch products from external API: ${error.message}`);
    }
};

module.exports = {
    fetchProductsFromExternalApi
};
