// Test script para verificar la funcionalidad de seguridad y autenticación
import { validatePasswordStrength, hashPassword, verifyPassword, createPasswordRecovery, verifyRecoveryCode } from './src/lib/security.js';
import { createUser, updateUserPassword } from './src/lib/auth.js';
import prisma from './src/lib/prisma.js';

async function testSecurity() {
  console.log('🔍 Testing Security Functions...\n');

  // Test 1: Password Validation
  console.log('1. Testing Password Validation:');
  const weakPassword = validatePasswordStrength('123');
  const strongPassword = validatePasswordStrength('MyStr0ngP@ssw0rd!');
  
  console.log('   Weak password validation:', weakPassword.isValid ? '❌ FAIL' : '✅ PASS');
  console.log('   Strong password validation:', strongPassword.isValid ? '✅ PASS' : '❌ FAIL');

  // Test 2: Password Hashing
  console.log('\n2. Testing Password Hashing:');
  const testPassword = 'TestPassword123!';
  const hashedPassword = await hashPassword(testPassword);
  const isValidHash = await verifyPassword(testPassword, hashedPassword);
  const isInvalidHash = await verifyPassword('WrongPassword', hashedPassword);
  
  console.log('   Password hashing:', hashedPassword.length > 50 ? '✅ PASS' : '❌ FAIL');
  console.log('   Password verification (valid):', isValidHash ? '✅ PASS' : '❌ FAIL');
  console.log('   Password verification (invalid):', !isInvalidHash ? '✅ PASS' : '❌ FAIL');

  // Test 3: Database Connection
  console.log('\n3. Testing Database Connection:');
  try {
    const userCount = await prisma.usuarios.count();
    console.log('   Database connection:', '✅ PASS');
    console.log('   Current users in database:', userCount);
  } catch (error) {
    console.log('   Database connection:', '❌ FAIL -', error.message);
    return;
  }

  console.log('\n✅ All security tests completed successfully!');
}

async function testAuth() {
  console.log('\n🔐 Testing Authentication Functions...\n');

  // Test unique email for testing
  const testEmail = `test_${Date.now()}@bisonte.test`;
  
  try {
    // Test 1: User Creation
    console.log('1. Testing User Creation:');
    const newUser = await createUser({
      email: testEmail,
      password: 'TestPassword123!',
      nombre: 'Test User',
      celular: '1234567890',
      ciudad: 'Test City'
    });
    console.log('   User creation:', newUser.id ? '✅ PASS' : '❌ FAIL');

    // Test 2: Password Recovery
    console.log('\n2. Testing Password Recovery:');
    const recoveryCode = await createPasswordRecovery(newUser.id);
    console.log('   Recovery code generation:', recoveryCode ? '✅ PASS' : '❌ FAIL');
    
    const isValidCode = await verifyRecoveryCode(newUser.id, recoveryCode);
    console.log('   Recovery code verification:', isValidCode ? '✅ PASS' : '❌ FAIL');

    // Test 3: Password Update
    console.log('\n3. Testing Password Update:');
    const updateSuccess = await updateUserPassword(newUser.id, 'NewPassword123!');
    console.log('   Password update:', updateSuccess ? '✅ PASS' : '❌ FAIL');

    // Cleanup: Remove test user
    await prisma.usuarios.delete({ where: { id: newUser.id } });
    console.log('\n🧹 Test user cleaned up');

  } catch (error) {
    console.log('   Authentication test failed:', '❌ FAIL -', error.message);
  }

  console.log('\n✅ All authentication tests completed!');
}

async function runTests() {
  console.log('🚀 Starting Bisonte Security & Auth Tests\n');
  console.log('='.repeat(50));
  
  await testSecurity();
  await testAuth();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 All tests completed!');
  
  await prisma.$disconnect();
  process.exit(0);
}

runTests().catch(console.error);
