with open("src/components/admin/AdminPanel.tsx", "r") as f:
    lines = f.readlines()

with open("src/components/admin/AdminPanel.tsx", "w") as f:
    for line in lines:
        if "📊 إحصائيات زوار الموقع الحقيقيين" in line: continue
        if "➕ إنشاء إعلان / حفلة جديدة فوراً بواسطة الإدارة" in line: continue
        if "🎟️ مراجعة وتأكيد حجوزات التذاكر والحفلات" in line: continue
        if "</h2>" in line and lines.index(line) > 990 and lines.index(line) < 1000: continue
        if "<p className=\"text-xs text-neutral-400 mt-1\">" in line and lines.index(line) < 1000: continue
        if "مراجعة وتفعيل الإعلانات الفاخرة" in line and lines.index(line) < 1000: continue
        if "استعراض البيانات والفعاليات" in line and lines.index(line) < 1000: continue
        if "قراءة رسائل الأعضاء، الرد السريع" in line and lines.index(line) < 1000: continue
        if "البحث عن الحسابات بالأرقام السرية" in line and lines.index(line) < 1000: continue
        if "تغيير العبارة السرية، مراقبة محاولات الاختراق" in line and lines.index(line) < 1000: continue
        if "تعديل وتخصيص أسماء التطبيق وشعاراته" in line and lines.index(line) < 1000: continue
        if "تعديل وتحديد قيمة حجز الإعلان" in line and lines.index(line) < 1000: continue
        if "تحليل حركة المرور الحية، واهتمامات الراقصين" in line and lines.index(line) < 1000: continue
        if "نموذج لوحة الإدارة المتكامل" in line and lines.index(line) < 1000: continue
        if "لوحة المسؤولين للتحقق من إيصالات" in line and lines.index(line) < 1000: continue
        if "</p>" in line and lines.index(line) > 1000 and lines.index(line) < 1010: continue
        if "</div>" in line and lines.index(line) > 1000 and lines.index(line) < 1015: continue
        if "<div className=\"mt-8\">" in line and lines.index(line) < 1015: continue
        if "<AnimatePresence mode=\"wait\">" in line and lines.index(line) < 1015: continue
        f.write(line)
