const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const badPart = `updateLocalStorageItem(updated);
      await saveAdSubmissionToFirestore(updated);
    } catch (err) {
      console.error('Error approving ad:', err);
    } finally {
      setActionLoading(null);`;

// Let's just find and remove the trailing duplicate. Wait, the problem is it left `updateLocalStorageItem` floating at line 750.
