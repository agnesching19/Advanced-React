// const stripe = require('stripe');
// const config = stripe(process.env.STRIPE_SECRET);
// module.exports = config;

module.exports = require('stripe')(process.env.STRIPE_SECRET); // This line works the same as the above 3 lines
