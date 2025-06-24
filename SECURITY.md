# 🔐 Security Guidelines

## API Key Management

### ⚠️ NEVER commit the following to version control:

- Supabase Service Role Key
- Resend API Key
- NextAuth Secret
- Database credentials
- Any production API keys

### ✅ Best Practices:

1. **Use Environment Variables**: Store all sensitive data in `.env.local`
2. **Separate Environments**: Use different API keys for development/staging/production
3. **Regular Rotation**: Rotate API keys periodically
4. **Principle of Least Privilege**: Use anon keys for client-side, service role only for server-side
5. **Monitor Usage**: Track API key usage for suspicious activity

## Environment Variable Setup

### Required Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"      # Client-side safe
SUPABASE_SERVICE_ROLE_KEY="your_service_key"       # Server-side only

# Authentication
NEXTAUTH_SECRET="your_secure_secret"               # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Email Service
RESEND_API_KEY="your_resend_key"

# Database
DATABASE_URL="postgresql://..."
```

## Security Incident Response

### If API Keys Are Exposed:

1. **Immediate Action**: Revoke exposed keys in respective dashboards
2. **Generate New Keys**: Create new API keys
3. **Update Environment**: Update all environments with new keys
4. **Git History**: Consider removing from git history if committed
5. **Monitor**: Watch for unauthorized usage

### Git History Cleanup (if secrets were committed):

```bash
# Remove sensitive files from git history
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch .env.local' \
--prune-empty --tag-name-filter cat -- --all

# Force push (⚠️ DANGEROUS - coordinate with team)
git push origin --force --all
```

## Service-Specific Security

### Supabase:

- Use Row Level Security (RLS) policies
- Anon key for client-side operations only
- Service role key for admin operations only
- Enable email confirmations
- Set up proper user roles

### Resend:

- Use domain authentication
- Set up SPF/DKIM records
- Monitor sending reputation
- Use templates for consistent branding

### NextAuth:

- Use strong JWT secrets
- Enable CSRF protection
- Set secure session settings
- Implement proper callbacks

## Monitoring & Alerts

### Set up monitoring for:

- Failed authentication attempts
- Unusual API usage patterns
- Database connection errors
- Email delivery failures

### Regular Security Audits:

- Review user permissions
- Check for unused API keys
- Validate RLS policies
- Update dependencies

## Development Guidelines

### Code Reviews:

- Check for hardcoded secrets
- Validate environment variable usage
- Review permission implementations
- Test authentication flows

### Testing:

- Use test API keys for development
- Mock external services in tests
- Validate error handling
- Test security boundaries

---

**Remember**: Security is everyone's responsibility. When in doubt, err on the side of caution.
