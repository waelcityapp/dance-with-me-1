const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const target = `  const loginUser = async (name: string, email: string, avatar?: string, customId?: string, password?: string, accountTier?: AccountTier) => {
    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = ((import.meta as any).env.VITE_ADMIN_EMAIL?.trim().toLowerCase()) || 'waelvts@gmail.com';`;

const newCode = `  const loginUser = async (name: string, email: string, avatar?: string, customId?: string, password?: string, accountTier?: AccountTier) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // SECURITY CHECK: Ensure the provided email matches the authenticated Firebase user
    // This prevents malicious users from hijacking accounts by modifying the email field
    if (auth.currentUser && auth.currentUser.email && auth.currentUser.email.toLowerCase() !== cleanEmail) {
      console.error("Security violation: Email mismatch.", auth.currentUser.email, cleanEmail);
      throw new Error("Security violation: Cannot login with an email that does not match your authentication provider.");
    }
    
    const adminEmail = ((import.meta as any).env.VITE_ADMIN_EMAIL?.trim().toLowerCase()) || 'waelvts@gmail.com';`;

content = content.replace(target, newCode);
fs.writeFileSync('src/context/AppContext.tsx', content);

console.log('done fixing login security');
