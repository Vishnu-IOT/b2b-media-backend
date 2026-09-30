const {
  Business, BusinessStory, BusinessStrategy, Achievement, Product, SupplierEnquiry, BusinessVideo, Question, Answer,
} = require('../models');

// URL segment -> model. Everything a Super Admin can approve / reject / delete under /api/admin/content/:type
const CONTENT_TYPES = {
  businesses: Business,
  stories: BusinessStory,
  strategies: BusinessStrategy,
  achievements: Achievement,
  products: Product,
  enquiries: SupplierEnquiry,
  videos: BusinessVideo,
  questions: Question,
  answers: Answer,
};

module.exports = { CONTENT_TYPES };
