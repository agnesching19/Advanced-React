const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, context, info) {
    // Check if there is a current user ID
    if (!context.request.userId) {
      return null;
    }
    return context.db.query.user(
      {
        where: { id: context.request.userId },
      },
      info
    );
  },
  async users(parent, args, context, info) {
    // Check if they are logged in
    if (!context.request.userId) {
      throw new Error('You must be logged in!');
    }
    // Check if the user has the permission to query all the users
    hasPermission(context.request.user, ['ADMIN', 'PERMISSIONUPDATE']);
    // If they do, query all the users
    return context.db.query.users({}, info);
  },
  async order(parent, args, context, info) {
    // Make sure they are logged in
    if (!context.request.userId) throw new Error("You aren't logged in!");
    // Query the current order
    const order = await context.db.query.order({
      where: { id: args.id },
    }, info);
    // Check if they have the permission to see this order
    const ownsOrder = order.user.id === context.request.userId;
    const hasPermissionToSeeOrder = context.request.user.permissions.includes('ADMIN');
    if (!ownsOrder || !hasPermissionToSeeOrder) {
      throw new Error("You aren't allowed to see this order!");
    }
    // Return the order
    return order;
  }
};

module.exports = Query;
