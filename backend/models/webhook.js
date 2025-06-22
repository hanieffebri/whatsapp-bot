module.exports = (sequelize, DataTypes) => {
  const Webhook = sequelize.define('Webhook', {
    url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    events: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('events');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('events', JSON.stringify(value));
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'webhooks'
  });

  Webhook.associate = function(models) {
    Webhook.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Webhook;
};