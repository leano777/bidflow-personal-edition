# 🚀 BidFlow Personal Edition - MANUAL START INSTRUCTIONS

## The server is set up correctly but needs to be started manually with error visibility.

---

## 📝 **STEP-BY-STEP INSTRUCTIONS** 

### **Step 1: Open New PowerShell Window**
1. Press `Windows Key + X`
2. Click **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
3. Click **"Yes"** when asked for administrator permissions

### **Step 2: Navigate to Project Directory**
Copy and paste this command:
```powershell
cd "C:\Users\Marco - ESDC\OneDrive - Elite SD Construction\Desktop\BLDR PROJECTS\General Contracting Price Proposal Template"
```

### **Step 3: Start the Development Server**
Run this command and **watch for errors**:
```powershell
npx next dev --port 3100
```

**What to expect:**
- You should see "Next.js 14.2.31" starting up
- Look for any **red error messages**
- Wait for it to say "Ready" or "Local: http://localhost:3100"

### **Step 4: Test in Browser**
Once you see "Ready", open your browser and try these URLs:

1. **Primary:** `http://localhost:3100`
2. **Alternative:** `http://127.0.0.1:3100`
3. **Test page:** `http://localhost:3100/test`

---

## 🔍 **WHAT TO LOOK FOR IN THE CONSOLE**

### ✅ **Success Messages:**
```
✓ Ready - started server on 0.0.0.0:3100
- Local:        http://localhost:3100
- Network:      http://192.168.x.x:3100
```

### ❌ **Common Error Messages:**
- **TypeScript errors:** Red text mentioning `.tsx` or `.ts` files
- **Module not found:** Missing dependencies
- **Port in use:** "EADDRINUSE" error
- **Permission denied:** Need to run as administrator

---

## 🛠️ **QUICK FIXES FOR COMMON ERRORS**

### **Error: "Port 3100 in use"**
```powershell
# Try a different port
npx next dev --port 3001
```

### **Error: TypeScript compilation failed**
```powershell
# Skip type checking temporarily
npx next dev --port 3100 --turbo
```

### **Error: Module not found**
```powershell
# Reinstall dependencies
npm install
```

### **Error: Permission denied**
Make sure you opened PowerShell **as Administrator**

---

## 🎯 **WHAT SUCCESS LOOKS LIKE**

### **In the Console:**
- ✅ "Ready - started server on..."
- ✅ No red error messages
- ✅ "Compiled successfully"

### **In the Browser:**
- ✅ Page loads within 3 seconds
- ✅ Shows BidFlow login page
- ✅ Professional blue/white design
- ✅ Three demo account buttons visible

---

## 🔐 **DEMO ACCOUNTS (once working)**

| Role | Email | Password |
|------|-------|----------|
| **Estimator** | `estimator@company.com` | `password123` |
| **Project Manager** | `pm@company.com` | `password123` |
| **Viewer** | `viewer@company.com` | `password123` |

---

## 🆘 **IF IT STILL DOESN'T WORK**

### **Try Alternative Port:**
```powershell
npx next dev --port 3001
# Then visit: http://localhost:3001
```

### **Try Simple HTTP Server:**
```powershell
npm install -g http-server
http-server -p 3100
# Then visit: http://localhost:3100/test.html
```

### **Create Fresh Next.js App (test):**
```powershell
cd ..
npx create-next-app@latest test-app
cd test-app
npm run dev
# This will test if Next.js works at all on your system
```

---

## 📞 **DEBUG CHECKLIST**

When running `npx next dev --port 3100`, check:

- [ ] Does it show "Next.js 14.2.31"?
- [ ] Any red error messages?
- [ ] Does it say "Ready" or "Compiled"?
- [ ] Can you see the port in: `netstat -ano | findstr :3100`?
- [ ] Does Windows Firewall ask for permission?
- [ ] Are you running as Administrator?

---

## ✅ **SUCCESS STEPS ONCE WORKING**

1. **Login** with any demo account
2. **Click "AI Proposal"** button  
3. **Explore** the estimation workspace
4. **Test** different user roles
5. **Check** field measurement tools

---

**💡 KEY TIP:** The most important thing is to watch the console output when you run `npx next dev --port 3100`. Any error messages there will tell us exactly what needs to be fixed.

**🎉 WHEN IT WORKS:** You'll see a beautiful modern web application with login screen, and you can access all the BidFlow Personal Edition features including AI-powered proposal generation, field measurement tools, and role-based permissions system.
