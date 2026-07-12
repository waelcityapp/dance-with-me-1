import re

with open("src/components/admin/AdminPanel.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "      {adminSection === 'pricing' && (" in line and "lang === 'ar' ?" not in line and "animate-fadeIn" not in line:
        # This is where the cut happened
        # We need to insert the missing parts
        new_lines.append("                {adminSection === 'analytics' && (lang === 'ar' ? '📊 إحصائيات زوار الموقع الحقيقيين واهتمام الجمهور' : '📊 Real-time Analytics & Audience Interest')}\n")
        new_lines.append("                {adminSection === 'create_ad_admin' && (lang === 'ar' ? '➕ إنشاء إعلان / حفلة جديدة فوراً بواسطة الإدارة' : '➕ Create & Publish Event Immediately (Admin)')}\n")
        new_lines.append("                {adminSection === 'bookings' && (lang === 'ar' ? '🎟️ مراجعة وتأكيد حجوزات التذاكر والحفلات' : '🎟️ Review & Confirm Ticket Bookings')}\n")
        new_lines.append("              </h2>\n")
        new_lines.append("              <p className=\"text-xs text-neutral-400 mt-1\">\n")
        new_lines.append("                {adminSection === 'submissions' && (lang === 'ar' ? 'مراجعة وتفعيل الإعلانات الفاخرة وتتبع إيصالات التحويل البنكي.' : 'Manage premium ad campaigns, analyze bank receipts, and activate VIP slots.')}\n")
        new_lines.append("                {adminSection === 'database' && (lang === 'ar' ? 'استعراض البيانات والفعاليات والإشعارات وحذف المخلفات بشكل مباشر.' : 'Real-time viewer of live Firestore collections, schemas, and events.')}\n")
        new_lines.append("                {adminSection === 'support' && (lang === 'ar' ? 'قراءة رسائل الأعضاء، الرد السريع، ومتابعة الاقتراحات والشكاوى.' : 'Read member messages, reply quickly, and track suggestions/complaints.')}\n")
        new_lines.append("                {adminSection === 'users' && (lang === 'ar' ? 'البحث عن الحسابات بالأرقام السرية أو الإيميل، تجميد أو حذف الأعضاء.' : 'Audit member profiles, passwords, registration dates, suspend or delete records.')}\n")
        new_lines.append("                {adminSection === 'security' && (lang === 'ar' ? 'تغيير العبارة السرية، مراقبة محاولات الاختراق، عناوين الـ IP للمهاجمين، وإعداد بلاغات أمنية.' : 'Update VIP secret code, monitor unauthorized access logs, block IPs, and prepare security reports.')}\n")
        new_lines.append("                {adminSection === 'branding' && (lang === 'ar' ? 'تعديل وتخصيص أسماء التطبيق وشعاراته وأيقوناته وروابط الاتصال بقاعدة البيانات في الوقت الفعلي.' : 'Modify app names, icons, brand logos, support contact phone, and other static assets.')}\n")
        new_lines.append("                {adminSection === 'pricing' && (lang === 'ar' ? 'تعديل وتحديد قيمة حجز الإعلان المميز والعادي لكل أسبوع أو يوم، مع تحديد نسبة الزيادة الخاصة بإعلانات الفيديو.' : 'Configure prices for VIP and Standard ads per week/day, and set video surcharge percentage.')}\n")
        new_lines.append("                {adminSection === 'analytics' && (lang === 'ar' ? 'تحليل حركة المرور الحية، واهتمامات الراقصين بالأنماط المختلفة، ونسب استخدام أزرار التواصل والخريطة.' : 'Live traffic insights, style-specific popularity heatmaps, and call-to-action click rates.')}\n")
        new_lines.append("                {adminSection === 'create_ad_admin' && (lang === 'ar' ? 'نموذج لوحة الإدارة المتكامل لإنشاء ونشر الفعاليات وتثبيتها وتحديد ترتيب ظهورها مباشرة دون انتظار أو دفع.' : 'Admin panel integrated form to compose, publish, pin, and prioritize events directly in real-time.')}\n")
        new_lines.append("                {adminSection === 'bookings' && (lang === 'ar' ? 'لوحة المسؤولين للتحقق من إيصالات تحويل فودافون كاش ومطابقة المبالغ وإصدار أكواد الدخول والباركود للحضور.' : 'Verify transfer receipts, match paid amounts, and activate barcodes/entry keys for guests.')}\n")
        new_lines.append("              </p>\n")
        new_lines.append("            </div>\n")
        new_lines.append("          </div>\n")
        new_lines.append("          <div className=\"mt-8\">\n")
        new_lines.append("            <AnimatePresence mode=\"wait\">\n")
        new_lines.append(line)
    else:
        new_lines.append(line)

with open("src/components/admin/AdminPanel.tsx", "w") as f:
    f.writelines(new_lines)
