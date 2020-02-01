const bcrypt= require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

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
  },
  async signin(parent, { email,password }, context, info) {
    // Check if there's a user with that email
    const user = await context.db.query.user({where: { email }});
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // Check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid password!');
    }
    // Generate the jwt token
    const token = jwt.sign({ user: user.id }, process.env.APP_SECRET);
    // Set the cookie with the token
    context.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // Return the user
    return user;
  },
  signout(parent, args, context, info) {
    context.response.clearCookie('token');
    return { message: 'Goodbye!'};
  },
  async requestReset(parent, args, context, info) {
    // Check if this is a real user
    const user = await context.db.query.user({ where: { email: args.email }});
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    // Set a reset token and expiry on that user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    const res = await context.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    console.log(res);
    return { message: 'Thanks!'};
    // Email them that reset user
  },
  async resetPassword(parent, args, context, info) {
    // Check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Your passwords don't match");
    }
    // Check if it's a legit reset token
    // Check if it's expired
    const [ user ] = await context.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });
    if (!user) {
      throw new Error ('This token is either invalid or expired!');
    }
    // Hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // Save the new password to the user and remove the old resetToken fields
    const updatedUser = await context.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    })
    // Generate jwt
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // Set the jwt cookie
    context.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // Return the new user
    return updatedUser;
  }
};

module.exports = Mutations;