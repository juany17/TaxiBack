// Script para generar hash de contraseña para el admin seed
// Ejecutar con: node generate-admin-hash.js
// Luego usar el hash en el archivo migrations/seed-admin.sql

const bcrypt = require('bcrypt');

const password = process.argv[2] || 'Admin123!';

(async () => {
  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(password, salt);
  console.log('Contraseña:', password);
  console.log('Hash:', hash);
  console.log('\nActualiza el archivo migrations/seed-admin.sql con este hash');
})();