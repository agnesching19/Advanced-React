const bcrypt= require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { hasPermission } = require('../utils');

const { transport, makeANiceEmail} = require('../mail');

const Mutations = {
  async createItem(parent, args, context, info) {
    if (!context.request.userId) {
      throw new Error('You must be logged in to do that!');
    }
    const item = await context.db.mutation.createItem({
      data: {
        // This is how to create a relationship between the Item and the User
        user: {
          connect: {
            id: context.request.userId
          }
        },
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
    // Email them that reset user
    const mailRes = await transport.sendMail({
      from: 'SnA@gmail.com',
      to: user.email,
      subject: "Your Password Reset Token",
      html: makeANiceEmail(
        `Your password reset token is here!
        \n\n 
        <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">
          Click here to reset
        </a>`
      )
    });
    // Return the message
    return { message: 'Thanks!'};
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
  },
  async updatePermissions(parent, args, context, info) {
    // Check if they are logged in
    if (!context.request.userId) {
      throw new Error('You must be logged in!');
    }
    // Query the current user
    const currentUser = await context.db.query.user({
      where: {
        id: context.request.userId
      },
    }, info);
    // Check if they have permissions to do this
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // Update the permissions
    return context.db.mutation.updateUser({
      data: {
        permissions: {
          set: args.permissions
        }
      },
      where: {
        id: args.userId
      },
    }, info);
  }
};

module.exports = Mutations;