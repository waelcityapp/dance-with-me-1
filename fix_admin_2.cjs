const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

code = code.replace(`      };
            await saveAdSubmissionToFirestore(updated);
    } catch (err) {
      console.error('Error approving ad:', err);
    } finally {
      setActionLoading(null);
    }
  };  };`, `      };
      updateLocalStorageItem(updated);
      await saveAdSubmissionToFirestore(updated);
    } catch (err) {
      console.error('Error approving ad:', err);
    } finally {
      setActionLoading(null);
    }
  };`);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
