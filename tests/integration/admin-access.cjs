// Run against an isolated, empty test database and a running test store.
// Exported for the MySQL integration harness; never run against production data.
const assert=require('node:assert/strict');
module.exports=async function testAdminAccess(origin,setupCode,conn){
  const base={'Content-Type':'application/json',Origin:origin};
  async function call(body,cookie,extra={}){
    const r=await fetch(origin+'/api/admin/session',{method:'POST',headers:{...base,...(cookie?{Cookie:cookie}:{}),...extra},body:JSON.stringify(body)});
    return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};
  }
  // Simulate the exact deployment failure: auth tables were never imported.
  for(const table of ['admin_sessions','admin_users','auth_limits','transaction_locks']) await conn.query('DROP TABLE '+table);
  assert.equal((await (await fetch(origin+'/api/admin/session')).json()).repairRequired,true);
  assert.equal((await call({action:'prepare',setupCode:'incorrect'})).status,401);
  const [untouched]=await conn.query("SHOW TABLES LIKE 'admin_users'");assert.equal(untouched.length,0);
  assert.equal((await call({action:'prepare',setupCode},null,{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await call({action:'prepare',setupCode})).status,200);
  const state=await (await fetch(origin+'/api/admin/session')).json();assert.equal(state.setupRequired,true);
  assert.equal((await fetch(origin+'/api/admin/products')).status,401);
  assert.equal((await fetch(origin+'/api/admin/products',{headers:{Authorization:'Bearer '+setupCode}})).status,401);
  assert.equal((await call({action:'setup',username:'owner',password:'test-password-123',setupCode:'incorrect'})).status,401);
  assert.equal((await call({action:'setup',username:'owner',password:'short',setupCode})).status,400);
  const owner=await call({action:'setup',username:'Owner',password:'test-password-123',setupCode});
  assert.equal(owner.status,200);assert.equal(owner.body.user.username,'owner');assert.ok(owner.cookie);
  assert.match(owner.headers.get('set-cookie'),/HttpOnly/i);assert.match(owner.headers.get('set-cookie'),/SameSite=strict/i);
  assert.equal(owner.body.user.password_hash,undefined);
  assert.equal((await call({action:'setup',username:'other',password:'test-password-123',setupCode})).status,400);
  const [rows]=await conn.query('SELECT password_hash FROM admin_users');assert.notEqual(rows[0].password_hash,'test-password-123');
  const [sessions]=await conn.query('SELECT token_hash FROM admin_sessions');assert.ok(!owner.cookie.includes(sessions[0].token_hash));
  // Repair can restore a lost session table, but cannot replace an existing owner.
  await conn.query('DROP TABLE admin_sessions');
  assert.equal((await (await fetch(origin+'/api/admin/session')).json()).repairRequired,true);
  assert.equal((await call({action:'prepare',setupCode})).status,200);
  const [preserved]=await conn.query('SELECT password_hash FROM admin_users');assert.equal(preserved[0].password_hash,rows[0].password_hash);
  assert.equal((await (await fetch(origin+'/api/admin/session')).json()).setupRequired,false);
  assert.equal((await call({action:'setup',username:'replacement',password:'test-password-123',setupCode})).status,400);
  const restored=await call({action:'login',username:'owner',password:'test-password-123'});assert.equal(restored.status,200);
  owner.cookie=restored.cookie;

  assert.equal((await call({action:'login',username:'owner',password:'wrong'})).status,401);
  assert.equal((await fetch(origin+'/api/admin/products',{headers:{Cookie:owner.cookie}})).status,200);
  assert.equal((await call({action:'logout'},owner.cookie,{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await call({action:'logout'},owner.cookie)).status,200);
  assert.equal((await fetch(origin+'/api/admin/products',{headers:{Cookie:owner.cookie}})).status,401);
  const login=await call({action:'login',username:'OWNER',password:'test-password-123'});assert.equal(login.status,200);
  assert.equal((await call({action:'password',currentPassword:'wrong',newPassword:'changed-password-123'},login.cookie)).status,400);
  assert.equal((await call({action:'password',currentPassword:'test-password-123',newPassword:'changed-password-123'},login.cookie)).status,200);
  assert.equal((await fetch(origin+'/api/admin/products',{headers:{Cookie:login.cookie}})).status,401);
  assert.equal((await call({action:'login',username:'owner',password:'test-password-123'})).status,401);
  const fresh=await call({action:'login',username:'owner',password:'changed-password-123'});assert.equal(fresh.status,200);
  await conn.query('UPDATE admin_sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND)');
  assert.equal((await fetch(origin+'/api/admin/products',{headers:{Cookie:fresh.cookie}})).status,401);
  const final=await call({action:'login',username:'owner',password:'changed-password-123'});assert.equal(final.status,200);
  for(let i=0;i<10;i++) assert.equal((await call({action:'login',username:'unknown',password:'wrong'})).status,401);
  assert.equal((await call({action:'login',username:'unknown',password:'wrong'})).status,429);
  console.log('PASS admin setup, hashed credentials, login, token rejection, CSRF, logout, password change, revoked and expired sessions');
  return {...base,Cookie:final.cookie};
};
