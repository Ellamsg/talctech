'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Properties', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
      },
      user_id: {
        allowNull: true,
        type: Sequelize.UUID
      },
      property_type: {
        allowNull: true,
        type: Sequelize.STRING
      },
      offer_type: {
        allowNull: true,
        type: Sequelize.STRING
      },
      price: {
        allowNull: true,
        type: Sequelize.STRING
      },
      city: {
        allowNull: true,
        type: Sequelize.STRING
      },
      neighbourhood: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      bedrooms: {
        allowNull: true,
        type: Sequelize.STRING
      },
      bathrooms: {
        allowNull: true,
        type: Sequelize.STRING
      },
      image_front: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      image_side: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      image_rear: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Properties');
  }
};