const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    api_key: {
      type: DataTypes.STRING(255),
      unique: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'users'
  });

  User.beforeSave(async (user) => {
    if (user.changed('password_hash')) {
      user.password_hash = await bcrypt.hash(user.password_hash, 10);
    }
    if (!user.api_key) {
      user.api_key = jwt.sign({ username: user.username }, config.jwt.secret, { expiresIn: '1y' });
    }
  });

  User.prototype.verifyPassword = function(password) {
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.generateAuthToken = function() {
    return jwt.sign({ id: this.id, username: this.username }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  };

  User.associate = function(models) {
    User.hasMany(models.Message, { foreignKey: 'user_id' });
    User.hasMany(models.Webhook, { foreignKey: 'user_id' });
  };

  return User;
};