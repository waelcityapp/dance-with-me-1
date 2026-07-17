const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const badCodeStart = code.indexOf('const index = local.findIndex(item => item.id === updatedSub.id);');
const badCodeEnd = code.indexOf('const promoDays = sub.pricing?.days || 3;} else if (sub.eventData) {') + ('const promoDays = sub.pricing?.days || 3;} else if (sub.eventData) {').length;

const replacement = `const index = local.findIndex(item => item.id === updatedSub.id);
        if (index >= 0) {
          local[index] = updatedSub;
        } else {
          local.unshift(updatedSub);
        }
      }
      localStorage.setItem('dwm_ad_submissions', JSON.stringify(local));
      
      // Update state immediately
      setSubmissions(prev => {
        if (deleteId) return prev.filter(item => item.id !== deleteId);
        if (updatedSub) {
          const exists = prev.some(item => item.id === updatedSub.id);
          if (exists) return prev.map(item => item.id === updatedSub.id ? updatedSub : item);
          return [updatedSub, ...prev];
        }
        return prev;
      });
    } catch (e) {}
  };

  const handleApprove = async (sub: AdSubmission) => {
    setActionLoading(sub.id);
    try {
      const positionValue = submissionPositions[sub.id] !== undefined ? submissionPositions[sub.id] : (sub.eventData?.position || 0);

      // 1. Create or save the actual event if eventData exists
      if (sub.eventData) {
        const eventId = \`ev_\${sub.adType || 'vip'}_\${Date.now()}\`;
        const newEv: DanceEvent = {
          ...sub.eventData,
          id: eventId,
          titleAr: sub.eventData.titleAr || sub.titleAr,
          titleEn: sub.eventData.titleEn || sub.titleEn,
          uploadDate: new Date().toISOString(),
          likesCount: 15,
          isFeatured: sub.adType === 'vip' || sub.eventData?.adType === 'vip',
          isWeeklyPromo: positionValue === 1, // dynamically set weekly promo based on position
          position: positionValue,
          adType: sub.adType || sub.eventData?.adType || 'standard'
        } as DanceEvent;

        // Add to state (this also saves to Firestore internally)
        addNewEvent(newEv);
      }

      // 2. Update submission status in Firestore with expiration timestamp
      const promoDays = sub.pricing?.days || 3;
      const expiresAtDate = new Date(Date.now() + promoDays * 86400000).toISOString();
      const updated: AdSubmission = {
        ...sub,
        status: 'approved',
        userRead: false,
        reviewedAt: new Date().toISOString(),
        expiresAt: expiresAtDate
      };
      updateLocalStorageItem(updated);
      await saveAdSubmissionToFirestore(updated);
    } catch (err) {
      console.error('Error approving ad:', err);
    } finally {
      setActionLoading(null);
    }
  };`;

// we also need to wipe out the remaining `else if (sub.eventData)` that got left over in the original code. Wait, the badCodeEnd catches the `} else if (sub.eventData) {` part. Let's make sure we also catch the body of that else if!

const originalElseIfEnd = code.indexOf('updateLocalStorageItem(updated);', badCodeEnd);
// Let's just replace from badCodeStart to originalElseIfEnd !
const fullReplacement = replacement + '\n';
code = code.substring(0, badCodeStart) + fullReplacement + code.substring(originalElseIfEnd);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
