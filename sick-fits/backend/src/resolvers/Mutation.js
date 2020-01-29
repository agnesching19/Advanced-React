const bcrypt= require('bcryptjs');
const jwt = require('jsonwebtoken');

const Mutations = {
  async createItem(parent, args, context, info) {
    const item = await context.db.mutation.createItem({
      data: {
        ...args
      }
    }, info);

    return item;
  },
  updateItem(parent, args, context, info) {
    // First take a copy of the updates
    const updates = { ...args };
    // Remove the ID from the updates
    delete updates.id;
    // Run the update method
    return context.db.mutation.updateItem({
      data: updates,
      where: {
        id: args.id
      }
    }, info);
  },
  async deleteItem(parent, args, context, info) {
    const where = { id: args.id };
    // Find the item
    const item = await context.db.query.item({ where }, `{ id title }`);
    // Check if they own the item, or have the permission
    // TODO
    // Delete it!
    return context.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, context, info) {
    // Lowercase their email
    args.email = args.email.toLowerCase();
    // Handle their password
    const password = await bcrypt.hash(args.password, 10);
    // Create the user in the database
    const user = await context.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ['USER'] },
      }
    }, info);
    // Create the jwt token for the user
    const token = jwt.sign({ user: user.id }, process.env.APP_SECRET);
    // We set the jwt as a cookie on the response
    context.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // Finally we return the user to the browser
    return user;
  }
};

module.exports = Mutations;