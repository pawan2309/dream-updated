Local multi-subdomain login setup
=================================

Goal: Test role-based logins locally with different hostnames mapping to the same backend.

1) Hosts file entries (Windows)
   Edit C:\\Windows\\System32\\drivers\\etc\\hosts as Administrator and append:

   127.0.0.1 batxgames.site
   127.0.0.1 sub-owner.batxgames.site
   127.0.0.1 super-admin.batxgames.site
   127.0.0.1 admin.batxgames.site
   127.0.0.1 sub.batxgames.site
   127.0.0.1 master.batxgames.site
   127.0.0.1 super-agent.batxgames.site
   127.0.0.1 agent.batxgames.site

2) Backend
   - Ensure EXTERNAL_API_PORT or port in backend/config/index.js is open (default 4001)
   - Start backend

3) Frontend
   - For each panel, use the matching origin to call backend. Example:
     - USER: https://batxgames.site
     - ADMIN: https://admin.batxgames.site
   - The backend extracts subdomain from req.hostname and assigns role via backend/auth/roleMap.js

4) Testing via curl (replace 4001 if different)
   curl -i -X POST http://admin.batxgames.site:4001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin@example.com","password":"plaintext"}'

   curl -i http://admin.batxgames.site:4001/auth/control-panel/ping \
     -H "Authorization: Bearer <token>"

   curl -i http://batxgames.site:4001/auth/client/ping \
     -H "Authorization: Bearer <token>"

Notes
-----
- CORS is configured to accept localhost, subdomain.localhost, and *.batxgames.site.
- Role → subdomain mapping is defined in backend/auth/roleMap.js
- Subdomain policies are in backend/auth/rbac.js

