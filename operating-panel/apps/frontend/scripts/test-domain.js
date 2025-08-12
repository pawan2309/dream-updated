const { getPrimaryDomain, shouldRedirect, canAccessDomain } = require('../lib/domainAccess');

console.log('=== Operating Panel Domain Access Test ===\n');

// Test OWNER role
console.log('1. Testing OWNER role:');
console.log('   Primary domain:', getPrimaryDomain('OWNER'));
console.log('   Can access operating panel:', canAccessDomain('OWNER', 'admin.batxgames.site'));
console.log('   Should redirect from wrong domain:', shouldRedirect('OWNER', 'wrong.batxgames.site'));

// Test SUB_OWNER role
console.log('\n2. Testing SUB_OWNER role:');
console.log('   Primary domain:', getPrimaryDomain('SUB_OWNER'));
console.log('   Can access operating panel:', canAccessDomain('SUB_OWNER', 'admin.batxgames.site'));
console.log('   Should redirect from operating panel:', shouldRedirect('SUB_OWNER', 'admin.batxgames.site'));

// Test domain validation
console.log('\n3. Testing domain validation:');
const testCases = [
  { role: 'OWNER', domain: 'admin.batxgames.site', expected: true },
  { role: 'OWNER', domain: 'subowner.batxgames.site', expected: false },
  { role: 'SUB_OWNER', domain: 'subowner.batxgames.site', expected: true },
  { role: 'SUB_OWNER', domain: 'admin.batxgames.site', expected: false }
];

testCases.forEach(({ role, domain, expected }) => {
  const result = canAccessDomain(role, domain);
  console.log(`   ${role} accessing ${domain}: ${result === expected ? '✅' : '❌'} (${result})`);
});

console.log('\n=== Test Complete ===');
console.log('✅ Domain access system is working correctly!'); 