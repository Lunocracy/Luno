showToastMessage(msg, durationMs = 3000) {
    const existing = document.getElementById('bfn-toast');
    if (existing) existing.remove();

    const isError = msg.includes('⚠️') || msg.includes('❌') || msg.includes('Error') || msg.includes('fatal');

    const toast = makeElement('div', {
      id: 'bfn-toast',
      style: {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        background: isError ? '#2c080a' : '#0f172a',
        border: '1px solid ' + (isError ? '#f85149' : '#3b82f6'),
        color: isError ? '#ff7b72' : '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        zIndex: '100000',
        fontSize: '12px',
        fontFamily: 'ui-monospace, monospace',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        opacity: '0',
        cursor: 'pointer',
        whiteSpace: 'pre-line',
        textAlign: 'center',
        maxWidth: '90vw',
        wordBreak: 'break-word'
      },
      onclick: () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(msg);
          toast.textContent = '📋 Copied message to clipboard!';
        } else {
          prompt('Copy message:', msg);
        }
      }
    }, msg + (isError ? '\n\n📋 Tap to Copy Output' : ''));

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    const timeout = isError ? 12000 : durationMs;
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, timeout);
  }