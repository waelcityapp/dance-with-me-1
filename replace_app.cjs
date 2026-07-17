const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace("const { activeTab, setActiveTab, user, openGuestAlert, guestAlertState, closeGuestAlert, isSupportModalOpen, closeSupportModal, setEditingEvent } = useApp();", "const { activeTab, setActiveTab, user, openGuestAlert, guestAlertState, closeGuestAlert, isSupportModalOpen, closeSupportModal, setEditingEvent, editingEvent } = useApp();");
code = code.replace("<AdminEditEventPage", "<AdminEditEventPage\n            key={editingEvent?.id || 'edit_ad'}");
fs.writeFileSync('src/App.tsx', code);
