module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    message_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    from_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    to_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT
    },
    media_url: {
      type: DataTypes.STRING(255)
    },
    media_type: {
      type: DataTypes.ENUM('image', 'document', 'audio', 'video', 'other')
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
      defaultValue: 'pending'
    },
    direction: {
      type: DataTypes.ENUM('inbound', 'outbound'),
      allowNull: false
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'messages'
  });

  Message.associate = function(models) {
    Message.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Message;
};