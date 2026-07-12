with open("src/components/admin/AdminPanel.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if "RefreshCw className=\"h-5 w-5 animate-spin\"" in line:
        continue
    if "جاري الإرسال" in line or "Sending..." in line:
        continue
    if "Bell className=\"h-5 w-5\"" in line:
        continue
    if "إرسال الإشعار لجميع الأعضاء الآن" in line or "Broadcast to All Members Now" in line:
        continue
    if "notifSending ?" in line:
        continue
    # Let's just not do this, it's too risky.
