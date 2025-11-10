// Wrapper for model operations targeting only the primary database
class SyncModel {
  // Create document in primary DB
  static async create(Model, data) {
    try {
      // For users, check existing by email
      if (Model.collection.name === 'users' && data.email) {
        const existing = await Model.findOne({ email: data.email });
        if (existing) {
          throw new Error(`Usuario con email ${data.email} ya existe`);
        }
      }

      const doc = new Model(data);
      const savedDoc = await doc.save();
      return savedDoc;
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  // Update document in primary DB
  static async updateOne(Model, filter, update) {
    try {
      const result = await Model.updateOne(filter, update);
      return result;
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }

  // Delete document in primary DB
  static async deleteOne(Model, filter) {
    try {
      const result = await Model.deleteOne(filter);
      return result;
    } catch (error) {
      console.error('Error en delete:', error);
      throw error;
    }
  }
}

module.exports = SyncModel;