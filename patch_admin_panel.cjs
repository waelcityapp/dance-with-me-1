const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const pricingCard = `            {/* Card X: Pricing Config */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('pricing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-emerald-500/30 hover:border-emerald-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/20 p-6 shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <DollarSign className="h-6 w-6 stroke-[2]" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '💰 التحكم في أسعار الإعلانات' : '💰 Manage Ad Prices'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'تعديل وتحديد قيمة حجز الإعلان المميز والعادي لكل أسبوع أو يوم، مع تحديد نسبة الزيادة الخاصة بإعلانات الفيديو.'
                    : 'Configure prices for VIP and Standard ads per week/day, and set video surcharge percentage.'}
                </p>
              </div>
            </motion.div>

`;

code = code.replace(
  "{/* Card 7: Live App Analytics & Traffic */}",
  pricingCard + "{/* Card 7: Live App Analytics & Traffic */}"
);

const pricingSection = `
      {adminSection === 'pricing' && (
        <div className="space-y-6 animate-fadeIn text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="rounded-3xl border border-emerald-500/30 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/20 p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-lg sm:text-xl font-extrabold text-white mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400 animate-pulse" />
              <span>{lang === 'ar' ? '💰 التحكم في أسعار الإعلانات' : '💰 Manage Ad Prices'}</span>
            </h3>
            
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* VIP Pricing Form */}
              <div className="bg-neutral-950 p-5 rounded-2xl border border-amber-500/30">
                <h4 className="text-amber-400 font-bold flex items-center gap-2 mb-4">
                  <Crown className="h-4 w-4" />
                  {lang === 'ar' ? 'أسعار الإعلان المميز (VIP)' : 'VIP Ad Pricing'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'السعر الأساسي (لأول أسبوع/7 أيام)' : 'Base Price (First 7 days)'}
                    </label>
                    <input 
                      type="number"
                      value={pricingConfig?.vip?.basePrice || 100}
                      onChange={(e) => updatePricingConfig({ ...pricingConfig, vip: { ...pricingConfig.vip, basePrice: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'سعر كل يوم زيادة' : 'Extra Day Price'}
                    </label>
                    <input 
                      type="number"
                      value={pricingConfig?.vip?.extraDayPrice || 20}
                      onChange={(e) => updatePricingConfig({ ...pricingConfig, vip: { ...pricingConfig.vip, extraDayPrice: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'نسبة الزيادة لإعلان الفيديو (%)' : 'Video Surcharge Percentage (%)'}
                    </label>
                    <input 
                      type="number"
                      value={pricingConfig?.vip?.videoSurchargePercentage || 20}
                      onChange={(e) => updatePricingConfig({ ...pricingConfig, vip: { ...pricingConfig.vip, videoSurchargePercentage: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Standard Pricing Form */}
              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-700">
                <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4" />
                  {lang === 'ar' ? 'أسعار الإعلان العادي (Standard)' : 'Standard Ad Pricing'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'السعر الأساسي (لأول أسبوع/7 أيام)' : 'Base Price (First 7 days)'}
                    </label>
                    <input 
                      type="number"
                      value={pricingConfig?.standard?.basePrice || 50}
                      onChange={(e) => updatePricingConfig({ ...pricingConfig, standard: { ...pricingConfig.standard, basePrice: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'سعر كل يوم زيادة' : 'Extra Day Price'}
                    </label>
                    <input 
                      type="number"
                      value={pricingConfig?.standard?.extraDayPrice || 10}
                      onChange={(e) => updatePricingConfig({ ...pricingConfig, standard: { ...pricingConfig.standard, extraDayPrice: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'نسبة الزيادة لإعلان الفيديو (%)' : 'Video Surcharge Percentage (%)'}
                    </label>
                    <input 
                      type="number"
                      value={pricingConfig?.standard?.videoSurchargePercentage || 10}
                      onChange={(e) => updatePricingConfig({ ...pricingConfig, standard: { ...pricingConfig.standard, videoSurchargePercentage: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/30">
                {lang === 'ar' ? '✅ يتم حفظ التعديلات فورياً في قاعدة البيانات' : '✅ Changes are saved instantly to database'}
              </span>
            </div>
          </div>
        </div>
      )}

`;

code = code.replace(
  "{adminSection === 'analytics' && (",
  pricingSection + "{adminSection === 'analytics' && ("
);

// Add condition to top banner
code = code.replace(
  "adminSection === 'branding' ? 'bg-pink-500/10 border border-pink-500/30 text-pink-400' :",
  "adminSection === 'branding' ? 'bg-pink-500/10 border border-pink-500/30 text-pink-400' :\n              adminSection === 'pricing' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :"
);
code = code.replace(
  "{adminSection === 'branding' && <Sparkles className=\"h-6 w-6 animate-pulse\" />}",
  "{adminSection === 'branding' && <Sparkles className=\"h-6 w-6 animate-pulse\" />}\n              {adminSection === 'pricing' && <DollarSign className=\"h-6 w-6\" />}"
);
code = code.replace(
  "{adminSection === 'branding' && (lang === 'ar' ? '🎨 هوية التطبيق وتطوير المظهر والشعارات' : '🎨 App Identity & Visual Branding')}",
  "{adminSection === 'branding' && (lang === 'ar' ? '🎨 هوية التطبيق وتطوير المظهر والشعارات' : '🎨 App Identity & Visual Branding')}\n                {adminSection === 'pricing' && (lang === 'ar' ? '💰 التحكم في أسعار الإعلانات' : '💰 Manage Ad Prices')}"
);
code = code.replace(
  "{adminSection === 'branding' && (lang === 'ar' ? 'تعديل وتخصيص أسماء التطبيق وشعاراته وأيقوناته وروابط الاتصال بقاعدة البيانات في الوقت الفعلي.' : 'Modify app names, icons, brand logos, support contact phone, and other static assets.')}",
  "{adminSection === 'branding' && (lang === 'ar' ? 'تعديل وتخصيص أسماء التطبيق وشعاراته وأيقوناته وروابط الاتصال بقاعدة البيانات في الوقت الفعلي.' : 'Modify app names, icons, brand logos, support contact phone, and other static assets.')}\n                {adminSection === 'pricing' && (lang === 'ar' ? 'تعديل وتحديد قيمة حجز الإعلان المميز والعادي لكل أسبوع أو يوم، مع تحديد نسبة الزيادة الخاصة بإعلانات الفيديو.' : 'Configure prices for VIP and Standard ads per week/day, and set video surcharge percentage.')}"
);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
