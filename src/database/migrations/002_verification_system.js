export default {
  name: '002_verification_system',
  
  up(db) {
    console.log('🔄 Adding verification system columns...');
    
    // Vérifier si les colonnes existent déjà
    const tableInfo = db.prepare('PRAGMA table_info(guilds)').all();
    const columnNames = tableInfo.map(col => col.name);
    
    if (!columnNames.includes('verification_channel')) {
      db.prepare('ALTER TABLE guilds ADD COLUMN verification_channel TEXT').run();
      console.log('✅ Added verification_channel column');
    }
    
    if (!columnNames.includes('verification_role')) {
      db.prepare('ALTER TABLE guilds ADD COLUMN verification_role TEXT').run();
      console.log('✅ Added verification_role column');
    }
    
    console.log('✅ Verification system migration completed');
  }
};
