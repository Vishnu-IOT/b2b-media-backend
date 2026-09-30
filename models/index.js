'use strict';
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {};
fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

const {
  User, Business, BusinessStory, BusinessStrategy, Achievement, Product, SupplierEnquiry, BusinessVideo,
  ResourceCategory, ResourcePost, Question, Answer, Notification,
} = db;

// Parent hasMany Child (as `as`) / Child belongsTo Parent (as `childAs`)
const oneToMany = (Parent, Child, foreignKey, as, childAs, onDelete = 'CASCADE') => {
  Parent.hasMany(Child, { foreignKey, as, onDelete, onUpdate: 'CASCADE' });
  Child.belongsTo(Parent, { foreignKey, as: childAs, onDelete, onUpdate: 'CASCADE' });
};

// User -> Business (one business profile per business admin)
User.hasOne(Business, { foreignKey: 'userId', as: 'business', onDelete: 'CASCADE' });
Business.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// Business -> its content
oneToMany(Business, BusinessStory, 'businessId', 'stories', 'business');
oneToMany(Business, BusinessStrategy, 'businessId', 'strategies', 'business');
oneToMany(Business, Achievement, 'businessId', 'achievements', 'business');
oneToMany(Business, Product, 'businessId', 'products', 'business');
oneToMany(Business, SupplierEnquiry, 'businessId', 'enquiries', 'business');
oneToMany(Business, BusinessVideo, 'businessId', 'videos', 'business');

// ResourceCategory -> ResourcePosts (a category with posts cannot be deleted)
oneToMany(ResourceCategory, ResourcePost, 'categoryId', 'posts', 'category', 'RESTRICT');
ResourcePost.belongsTo(User, { foreignKey: 'createdBy', as: 'author', onDelete: 'SET NULL' });

// Q&A
oneToMany(User, Question, 'userId', 'questions', 'user');
oneToMany(Question, Answer, 'questionId', 'answers', 'question');
oneToMany(User, Answer, 'userId', 'answers', 'user');
oneToMany(User, Notification, 'userId', 'notifications', 'user');
Notification.belongsTo(Question, { foreignKey: 'questionId', as: 'question', onDelete: 'CASCADE' });
Notification.belongsTo(Answer, { foreignKey: 'answerId', as: 'answer', onDelete: 'CASCADE' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
