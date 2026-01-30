export default {
  name: '002_verification_system',
  
  async up(db) {
    console.log('🔄 Adding verification system columns...');
    
    try {
      // Vérifier si les colonnes existent déjà
      const tableInfo = db.prepare('PRAGMA table_info(guilds)').all();
      const columnNames = tableInfo.map(col => col.name);
      
      if (!columnNames.includes('verification_channel')) {
        db.prepare('ALTER TABLE guilds ADD COLUMN verification_channel TEXT').run();
        console.log('✅ Added verification_channel column');
      } else {
        console.log('ℹ️ verification_channel already exists');
      }
      
      if (!columnNames.includes('verification_role')) {
        db.prepare('ALTER TABLE guilds ADD COLUMN verification_role TEXT').run();
        console.log('✅ Added verification_role column');
      } else {
        console.log('ℹ️ verification_role already exists');
      }
      
      console.log('✅ Verification system migration completed');
    } catch (error) {
      console.error('❌ Migration error:', error);
      throw error;
    }
  }
};
