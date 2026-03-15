# Next 5 actions (user)

Do these when you’re ready; order is flexible.

1. **9soccer iOS TestFlight**  
   Upload `C:\Projects\9soccer\certs\request.csr` to [Apple Certificates](https://developer.apple.com/account/resources/certificates/list) → Apple Distribution → download .cer → save as `certs\distribution.cer`. Run `.\scripts\build-p12-and-secret.ps1` in 9soccer, then `gh workflow run "iOS TestFlight"`.

2. **Wingman TestFlight testers**  
   In [App Store Connect → TestFlight](https://appstoreconnect.apple.com/apps/6760245903/testflight/ios) add internal/external testers. Handle export compliance if prompted.

3. **Wingman smoke-test**  
   Install build 8 from TestFlight, test login (~8s), main tabs, and delete account from settings.

4. **PostPilot / 9soccer / Wingman — push commits**  
   Push any local commits: Wingman `master` → origin, PostPilot `main`, 9soccer `master` → `main`, ZPM `master` → origin so remotes are up to date.

5. **9soccer web deploy**  
   Deploy `out/` to 9soccer.ftable.co.il (or confirm current host) and set production env vars from DEPLOY.md.

---

*After these:* 9soccer can ship to TestFlight; Wingman testers can use build 8; all he-first and docs are committed.
