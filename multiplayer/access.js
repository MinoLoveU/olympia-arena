import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';

// Only the salted verifier belongs in server configuration, never browser assets.
export function hashPassword(password){
 const salt=randomBytes(16).toString('hex');
 return salt+':'+scryptSync(password,salt,32).toString('hex');
}
export function verifyPassword(password,verifier){
 if(typeof password!=='string'||password.length>128||!password)return false;
 if(!/^[a-f0-9]{32}:[a-f0-9]{64}$/.test(verifier||''))return false;
 const [salt,hash]=verifier.split(':');
 return timingSafeEqual(scryptSync(password,salt,32),Buffer.from(hash,'hex'));
}
