import re

with open("src/components/admin/AdminPanel.tsx", "r") as f:
    content = f.read()

# Remove the multiple UI injections
pattern = r"\s*\{adminSection === 'send_notifications' && \((.*?)\)\}\n"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open("src/components/admin/AdminPanel.tsx", "w") as f:
    f.write(content)

