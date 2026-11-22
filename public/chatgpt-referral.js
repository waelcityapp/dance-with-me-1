(() => {
  if (new URLSearchParams(location.search).get('utm_source')?.toLowerCase() !== 'chatgpt.com') return;
  const key = 'cityeve:chatgpt-referral';
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Tracking still works when session storage is unavailable.
  }

  fetch('/api/chatgpt-referral', { method: 'POST', keepalive: true })
    .then(response => {
      if (!response.ok) throw new Error('Referral was not recorded');
    })
    .catch(() => {
      try { sessionStorage.removeItem(key); } catch {}
    });
})();
