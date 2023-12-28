'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING
      },
      email: {
        allowNull: true,
        type: Sequelize.STRING
      },
      email_verified: {
        type: Sequelize.BOOLEAN
      },
      phone: {
        allowNull: true,
        type: Sequelize.STRING
      },
      password: {
        allowNull: true,
        type: Sequelize.STRING
      },
      role_id: {
        allowNull: false,
        defaultValue: 3,
        type: Sequelize.INTEGER
      },
      upgraded: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      suspended: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      paired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      usertype: {
        allowNull: true,
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: true,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};