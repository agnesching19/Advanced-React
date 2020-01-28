const { forwardTo } = require('prisma-binding');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  // async items(parent, args, context, info) {
  //   const allItems = await context.db.query.items();
  //   return allItems;
  // }
};

module.exports = Query;
