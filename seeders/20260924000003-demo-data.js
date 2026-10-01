'use strict';
// Optional sample data for local development: one business admin, one published business with content, two resource posts.
const { User, Business, BusinessStory, Product, Achievement, SupplierEnquiry, BusinessVideo, ResourceCategory, ResourcePost } = require('../models');

module.exports = {
  async up() {
    const admin = await User.findOne({ where: { role: 'SUPER_ADMIN' } });

    const [owner] = await User.findOrCreate({
      where: { email: 'demo@business.com' },
      defaults: { name: 'Demo Business Admin', password: 'Demo@12345', role: 'BUSINESS_ADMIN', isEmailVerified: true },
    });

    const [business] = await Business.findOrCreate({
      where: { userId: owner.id },
      defaults: {
        companyName: 'Sunrise Foods', slug: 'sunrise-foods', industry: 'Food Processing', location: 'Salem, Tamil Nadu',
        description: 'Family-run MSME making packaged millet snacks.', status: 'PUBLISHED',
      },
    });

    const now = new Date();
    const items = [
      [BusinessStory, { title: 'How we started from a home kitchen', content: 'Our journey from a kitchen table to a 40-person unit.', status: 'PUBLISHED', publishedAt: now }],
      [Product, { name: 'Ragi Crunch', slug: 'ragi-crunch', description: 'New ragi snack, launching soon.', launchDate: '2026-12-01', status: 'PUBLISHED' }],
      [Achievement, { title: 'State MSME Excellence Award', awardName: 'MSME Excellence', awardedBy: 'State MSME Department', awardDate: '2026-03-15', status: 'PUBLISHED' }],
      [SupplierEnquiry, { title: 'Looking for eco-friendly packaging supplier', description: 'Need 10,000 units/month of compostable pouches.', category: 'Packaging', location: 'Tamil Nadu', contactInfo: 'procurement@sunrisefoods.example', status: 'PUBLISHED' }],
      [BusinessVideo, { title: 'Factory tour', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', type: 'YOUTUBE', status: 'PUBLISHED' }],
    ];
    for (const [Model, values] of items) {
      const where = values.slug ? { slug: values.slug } : { businessId: business.id, title: values.title };
      // eslint-disable-next-line no-await-in-loop
      await Model.findOrCreate({ where, defaults: { ...values, businessId: business.id } });
    }

    const posts = [
      ['marketing', '5 Marketing Strategies for MSMEs', '5-marketing-strategies-for-msmes'],
      ['gst', 'Latest GST Update', 'latest-gst-update'],
    ];
    for (const [categorySlug, title, slug] of posts) {
      // eslint-disable-next-line no-await-in-loop
      const category = await ResourceCategory.findOne({ where: { slug: categorySlug } });
      if (category) {
        // eslint-disable-next-line no-await-in-loop
        await ResourcePost.findOrCreate({
          where: { slug },
          defaults: { categoryId: category.id, title, summary: `${title} — sample post.`, content: `<p>${title}. Replace this with real content.</p>`, status: 'PUBLISHED', publishedAt: now, createdBy: admin ? admin.id : null },
        });
      }
    }
  },
  async down() {
    await User.destroy({ where: { email: 'demo@business.com' } });
    await ResourcePost.destroy({ where: { slug: ['5-marketing-strategies-for-msmes', 'latest-gst-update'] } });
  },
};
