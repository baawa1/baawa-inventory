# 🚨 Git History Cleanup: Step-by-Step Safe Process

## ⚠️ CRITICAL: Read Before Proceeding

This process will **rewrite git history** and can cause issues for team members.

### Pre-Cleanup Checklist

1. **Notify your team** - Coordinate with all contributors
2. **Backup everything** - Create a backup of your repository
3. **Check for collaborators** - Ensure no one is actively working
4. **List all branches** - Document all remote branches that need cleaning

### Step 1: Create Backup

```bash
# Create a complete backup
cd ..
cp -r inventory-pos inventory-pos-backup
cd inventory-pos
```

### Step 2: Install BFG (if not already installed)

```bash
# On macOS with Homebrew
brew install bfg

# Or download directly
# wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
```

### Step 3: Clean Secrets from ALL Branches

```bash
# Clean the secrets from all history
java -jar bfg.jar --replace-text secrets-to-remove.txt

# Alternative: Clean specific files
# java -jar bfg.jar --delete-files .env.local
```

### Step 4: Clean up and Prepare

```bash
# Clean up the cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Check what changed
git log --oneline -10
```

### Step 5: Force Push (THE DANGEROUS PART)

```bash
# ⚠️ POINT OF NO RETURN ⚠️
git push origin --force --all
git push origin --force --tags
```

## Alternative: Safer Repository Reset Method

If you want to be extra safe and don't mind losing git history:

### Option A: Create Fresh Repository

1. Download your current code as ZIP
2. Delete the GitHub repository
3. Create a new repository
4. Upload clean code without secrets
5. Start fresh history

### Option B: Selective Branch Cleaning

```bash
# Clean only main branch, keep others for now
git push origin main --force

# Let teammates know to:
# 1. Backup their work
# 2. Delete local repository
# 3. Clone fresh from GitHub
# 4. Recreate their feature branches
```

## Post-Cleanup Team Instructions

Send this to your team AFTER force pushing:

```bash
# Team members should:
1. Backup any local work
   git stash
   git branch backup-my-work

2. Delete and re-clone
   cd ..
   rm -rf inventory-pos
   git clone [repository-url]
   cd inventory-pos

3. Recreate feature branches from backup
   git checkout -b my-feature
   # Apply backed up changes
```

## Verification Steps

```bash
# Verify secrets are gone
git log --all --grep="password\|secret\|key" --oneline
git log --all -S "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --oneline

# Check GitGuardian status
# - Go to GitHub Security tab
# - Verify alerts are resolved
```

## If Something Goes Wrong

```bash
# Restore from backup
cd ..
rm -rf inventory-pos
mv inventory-pos-backup inventory-pos
cd inventory-pos

# Force push the backup
git push origin main --force
```

---

## Recommendation

Given the complexity and risks, I suggest:

1. **First**: Rotate the exposed keys immediately (most important)
2. **Then**: Use the BFG method during a planned maintenance window
3. **Coordinate**: With all team members before proceeding
4. **Consider**: If this is a solo project, the risk is much lower

Would you like me to proceed with the cleanup, or would you prefer to coordinate with your team first?
