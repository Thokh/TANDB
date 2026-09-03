// InstaCheck Pro Frontend Logic - With License System, Admin Panel & Auto-Loop
document.addEventListener('DOMContentLoaded', () => {
  // State
  let results = [];
  let isRunning = false;
  let abortController = null;
  let currentFilter = 'all';
  let searchQuery = '';
  let loopCount = 0;
  let countdownTimer = null;
  let countdownSeconds = 60;
  let saveDebounceTimer = null;

  // License State
  let activeLicenseKey = localStorage.getItem('instacheck_license_key') || '';
  let licenseInfo = null;

  // DOM Elements
  const themeToggle = document.getElementById('themeToggle');
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // License Elements
  const licenseModal = document.getElementById('licenseModal');
  const licenseForm = document.getElementById('licenseForm');
  const modalKeyInput = document.getElementById('modalKeyInput');
  const modalKeyError = document.getElementById('modalKeyError');
  const btnActivateKey = document.getElementById('btnActivateKey');
  const activateSpinner = document.getElementById('activateSpinner');
  const btnUseDemoKey = document.getElementById('btnUseDemoKey');
  const btnCloseLicenseModal = document.getElementById('btnCloseLicenseModal');
  const licenseStatusChip = document.getElementById('licenseStatusChip');
  const licenseTextDisplay = document.getElementById('licenseTextDisplay');
  const btnManageLicense = document.getElementById('btnManageLicense');

  // Admin Modal Elements
  const btnAdminPanel = document.getElementById('btnAdminPanel');
  const adminModal = document.getElementById('adminModal');
  const btnCloseAdminModal = document.getElementById('btnCloseAdminModal');
  const newKeyInput = document.getElementById('newKeyInput');
  const newKeyName = document.getElementById('newKeyName');
  const newKeyExpire = document.getElementById('newKeyExpire');
  const btnGenRandomKey = document.getElementById('btnGenRandomKey');
  const btnSubmitNewKey = document.getElementById('btnSubmitNewKey');
  const adminTotalKeys = document.getElementById('adminTotalKeys');
  const btnRefreshKeys = document.getElementById('btnRefreshKeys');
  const adminKeysTableBody = document.getElementById('adminKeysTableBody');

  // Bulk Check Elements
  const usernamesInput = document.getElementById('usernamesInput');
  const inputCountText = document.getElementById('inputCountText');
  const btnClearInput = document.getElementById('btnClearInput');
  const btnSampleData = document.getElementById('btnSampleData');
  const fileInput = document.getElementById('fileInput');
  const concurrencySelect = document.getElementById('concurrencySelect');
  const delaySelect = document.getElementById('delaySelect');
  const btnStartBatch = document.getElementById('btnStartBatch');
  const btnStopBatch = document.getElementById('btnStopBatch');

  // Auto-Loop Elements
  const autoLoopCard = document.querySelector('.auto-loop-card');
  const autoLoopToggle = document.getElementById('autoLoopToggle');
  const autoLoopStatusBadge = document.getElementById('autoLoopStatusBadge');
  const autoLoopSwitchLabel = document.getElementById('autoLoopSwitchLabel');
  const autoLoopInterval = document.getElementById('autoLoopInterval');
  const countdownTime = document.getElementById('countdownTime');
  const countdownStatus = document.getElementById('countdownStatus');
  const loopCounter = document.getElementById('loopCounter');
  const lastCheckTime = document.getElementById('lastCheckTime');
  const autoSaveIndicator = document.getElementById('autoSaveIndicator');
  const btnTriggerNow = document.getElementById('btnTriggerNow');

  // Progress & Stats Elements
  const progressSection = document.getElementById('progressSection');
  const progressStatusText = document.getElementById('progressStatusText');
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressSpinner = document.getElementById('progressSpinner');

  const statTotal = document.getElementById('statTotal');
  const statLive = document.getElementById('statLive');
  const statDie = document.getElementById('statDie');
  const statError = document.getElementById('statError');
  const statRate = document.getElementById('statRate');

  // Table & Filter Elements
  const filterBtns = document.querySelectorAll('.filter-btn');
  const filterAllCount = document.getElementById('filterAllCount');
  const filterLiveCount = document.getElementById('filterLiveCount');
  const filterDieCount = document.getElementById('filterDieCount');
  const filterErrorCount = document.getElementById('filterErrorCount');
  const tableSearchInput = document.getElementById('tableSearchInput');
  const resultsTableBody = document.getElementById('resultsTableBody');

  // Actions
  const btnCopyLive = document.getElementById('btnCopyLive');
  const btnCopyDie = document.getElementById('btnCopyDie');
  const btnCopyAll = document.getElementById('btnCopyAll');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnExportJSON = document.getElementById('btnExportJSON');
  const btnClearResults = document.getElementById('btnClearResults');

  // Single Check Elements
  const singleCheckForm = document.getElementById('singleCheckForm');
  const singleUsernameInput = document.getElementById('singleUsernameInput');
  const btnSingleSubmit = document.getElementById('btnSingleSubmit');
  const singleSpinner = document.getElementById('singleSpinner');
  const singleResultCard = document.getElementById('singleResultCard');

  // Toast
  const toast = document.getElementById('toast');

  // Helper to build headers with active license key
  function getAuthHeaders(extraHeaders = {}) {
    const headers = { 'Content-Type': 'application/json', ...extraHeaders };
    if (activeLicenseKey) {
      headers['X-License-Key'] = activeLicenseKey;
    }
    return headers;
  }

  // 1. Theme Toggle
  const savedTheme = localStorage.getItem('instacheck_theme') || 'dark';
  document.body.className = savedTheme;
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    document.body.className = newTheme;
    localStorage.setItem('instacheck_theme', newTheme);
  });

  // 2. Navigation Tabs
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      navTabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`${target}Tab`).classList.add('active');
    });
  });

  // 3. License Key Management & Verification
  function showLicenseModal(errorMsg = '') {
    licenseModal.classList.remove('hidden');
    if (errorMsg) {
      modalKeyError.textContent = errorMsg;
      modalKeyError.classList.remove('hidden');
    } else {
      modalKeyError.classList.add('hidden');
    }
    modalKeyInput.value = activeLicenseKey || '';
    modalKeyInput.focus();
  }

  function hideLicenseModal() {
    licenseModal.classList.add('hidden');
    modalKeyError.classList.add('hidden');
  }

  async function verifyLicenseKey(keyToVerify, isUserAction = false) {
    if (!keyToVerify) {
      showLicenseModal('Vui lòng nhập License Key để kích hoạt ứng dụng!');
      return false;
    }

    btnActivateKey.disabled = true;
    activateSpinner.classList.remove('hidden');

    try {
      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyToVerify.trim() })
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        activeLicenseKey = data.key;
        licenseInfo = data;
        localStorage.setItem('instacheck_license_key', activeLicenseKey);

        if (data.role === 'admin') {
          licenseTextDisplay.innerHTML = '👑 <strong>Admin Master</strong>';
          btnAdminPanel.classList.remove('hidden');
        } else {
          licenseTextDisplay.innerHTML = `🔑 ${escapeHtml(data.name)} (${escapeHtml(data.expireAt)})`;
          btnAdminPanel.classList.add('hidden');
        }

        licenseStatusChip.classList.remove('unlicensed');
        hideLicenseModal();

        if (isUserAction) {
          showToast(`Kích hoạt thành công: ${data.name}!`);
        }
        return true;
      } else {
        showLicenseModal(data.error || 'License Key không hợp lệ!');
        licenseStatusChip.classList.add('unlicensed');
        licenseTextDisplay.textContent = 'Chưa kích hoạt Key';
        btnAdminPanel.classList.add('hidden');
        return false;
      }
    } catch (err) {
      showLicenseModal(`Lỗi kết nối máy chủ: ${err.message}`);
      return false;
    } finally {
      btnActivateKey.disabled = false;
      activateSpinner.classList.add('hidden');
    }
  }

  licenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = modalKeyInput.value.trim();
    if (!val) return;
    await verifyLicenseKey(val, true);
  });

  btnUseDemoKey.addEventListener('click', () => {
    modalKeyInput.value = 'DEMO-KEY-7DAYS';
    verifyLicenseKey('DEMO-KEY-7DAYS', true);
  });

  btnManageLicense.addEventListener('click', () => {
    showLicenseModal();
  });

  btnCloseLicenseModal.addEventListener('click', () => {
    // Only close if key is already valid
    if (licenseInfo && licenseInfo.valid) {
      hideLicenseModal();
    } else {
      showToast('Bạn cần kích hoạt License Key để sử dụng ứng dụng!', 'error');
    }
  });

  // 4. Admin Key Management Modal Logic
  btnAdminPanel.addEventListener('click', () => {
    adminModal.classList.remove('hidden');
    loadAdminKeysList();
  });

  btnCloseAdminModal.addEventListener('click', () => {
    adminModal.classList.add('hidden');
  });

  btnGenRandomKey.addEventListener('click', () => {
    newKeyInput.value = generateRandomKey();
  });

  function generateRandomKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p1 = '', p2 = '';
    for (let i = 0; i < 4; i++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    return `VIP-${p1}-${p2}`;
  }

  async function loadAdminKeysList() {
    try {
      const res = await fetch('/api/admin/keys', {
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        showToast('Bạn không có quyền truy cập trang quản trị!', 'error');
        adminModal.classList.add('hidden');
        return;
      }

      const data = await res.json();
      adminTotalKeys.textContent = data.keys.length;

      if (!data.keys || data.keys.length === 0) {
        adminKeysTableBody.innerHTML = `
          <tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">Chưa có Key nào. Hãy tạo Key đầu tiên ở trên!</td></tr>
        `;
        return;
      }

      adminKeysTableBody.innerHTML = '';
      data.keys.forEach(k => {
        const tr = document.createElement('tr');
        const isExpired = k.expireAt !== 'Vĩnh viễn' && new Date(k.expireAt).getTime() < Date.now();
        const statusBadge = isExpired
          ? '<span class="badge-status badge-die">✕ Hết hạn</span>'
          : '<span class="badge-status badge-live">● Hoạt động</span>';

        tr.innerHTML = `
          <td><code>${escapeHtml(k.key)}</code></td>
          <td><strong>${escapeHtml(k.name || '-')}</strong></td>
          <td>${escapeHtml(k.createdAt || '-')}</td>
          <td>${escapeHtml(k.expireAt || 'Vĩnh viễn')}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-outline btn-sm" onclick="window.copyKeyToClipboard('${escapeHtml(k.key)}')">
                📋 Copy
              </button>
              <button class="btn btn-outline btn-sm text-danger" onclick="window.deleteAdminKey('${escapeHtml(k.key)}')">
                🗑️ Xóa
              </button>
            </div>
          </td>
        `;
        adminKeysTableBody.appendChild(tr);
      });
    } catch (err) {
      showToast(`Lỗi: ${err.message}`, 'error');
    }
  }

  btnRefreshKeys.addEventListener('click', loadAdminKeysList);

  btnSubmitNewKey.addEventListener('click', async () => {
    const keyVal = newKeyInput.value.trim().toUpperCase();
    const nameVal = newKeyName.value.trim();
    const expireOption = newKeyExpire.value;

    if (!keyVal) {
      showToast('Vui lòng nhập mã Key!', 'error');
      newKeyInput.focus();
      return;
    }

    let expireAtStr = 'Vĩnh viễn';
    if (expireOption !== 'never') {
      const days = parseInt(expireOption) || 30;
      const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      expireAtStr = targetDate.toISOString().split('T')[0];
    }

    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          key: keyVal,
          name: nameVal || 'Khách hàng',
          expireAt: expireAtStr
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Đã tạo License Key thành công: ${keyVal}`);
        newKeyInput.value = '';
        newKeyName.value = '';
        loadAdminKeysList();
      } else {
        showToast(`Lỗi: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`Lỗi: ${err.message}`, 'error');
    }
  });

  window.copyKeyToClipboard = function(keyText) {
    copyToClipboard(keyText);
    showToast(`Đã sao chép License Key: ${keyText}`);
  };

  window.deleteAdminKey = async function(keyToDelete) {
    if (!confirm(`Bạn có chắc muốn XÓA / THU HỒI License Key: "${keyToDelete}"?\nKhách hàng sẽ bị khóa phần mềm ngay lập tức!`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key: keyToDelete })
      });
      if (res.ok) {
        showToast(`Đã xóa Key: ${keyToDelete}`);
        loadAdminKeysList();
      } else {
        const data = await res.json();
        showToast(`Lỗi: ${data.error}`, 'error');
      }
    } catch (err) {
      showToast(`Lỗi: ${err.message}`, 'error');
    }
  };

  // 5. Followers Parsing & Diff Helper
  function parseFollowersCount(str) {
    if (!str || str === 'N/A' || str === '-') return null;
    const clean = str.toString().trim().toUpperCase().replace(/,/g, '');
    if (clean.endsWith('M')) {
      return parseFloat(clean.replace('M', '')) * 1000000;
    }
    if (clean.endsWith('K')) {
      return parseFloat(clean.replace('K', '')) * 1000;
    }
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }

  function formatFollowersDiff(prevStr, currStr) {
    if (!prevStr || prevStr === '-' || prevStr === 'N/A') {
      return '<span class="change-badge change-same">Mới 🆕</span>';
    }
    if (prevStr === currStr) {
      return '<span class="change-badge change-same">0 (Không đổi)</span>';
    }
    const pNum = parseFollowersCount(prevStr);
    const cNum = parseFollowersCount(currStr);
    if (pNum !== null && cNum !== null) {
      const diff = cNum - pNum;
      if (diff > 0) {
        const text = diff >= 1000 ? `+${(diff / 1000).toFixed(1)}K` : `+${diff}`;
        return `<span class="change-badge change-up">▲ ${text}</span>`;
      } else if (diff < 0) {
        const absDiff = Math.abs(diff);
        const text = absDiff >= 1000 ? `-${(absDiff / 1000).toFixed(1)}K` : `-${absDiff}`;
        return `<span class="change-badge change-down">▼ ${text}</span>`;
      }
    }
    return `<span class="change-badge change-up">${prevStr} ➔ ${currStr}</span>`;
  }

  // 6. Persistence / Auto-Save System
  async function saveStateToBackend() {
    try {
      const payload = {
        rawInput: usernamesInput.value,
        results,
        autoLoop: autoLoopToggle.checked,
        intervalSeconds: parseInt(autoLoopInterval.value) || 60,
        loopCount,
        lastCheckTime: lastCheckTime.textContent,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('instacheck_saved_state', JSON.stringify(payload));

      await fetch('/api/state', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const nowStr = new Date().toLocaleTimeString('vi-VN');
      autoSaveIndicator.textContent = `Tự lưu: ${nowStr}`;
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  }

  function scheduleAutoSave() {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(saveStateToBackend, 800);
  }

  async function loadStateFromBackend() {
    try {
      let state = null;
      try {
        const res = await fetch('/api/state', {
          headers: getAuthHeaders()
        });
        if (res.ok) state = await res.json();
      } catch (e) {}

      if (!state || (!state.rawInput && (!state.results || state.results.length === 0))) {
        const local = localStorage.getItem('instacheck_saved_state');
        if (local) state = JSON.parse(local);
      }

      if (state) {
        if (state.rawInput) {
          usernamesInput.value = state.rawInput;
          updateInputCount();
        }
        if (Array.isArray(state.results) && state.results.length > 0) {
          results = state.results;
          renderTable();
          const live = results.filter(r => r.status === 'LIVE').length;
          const die = results.filter(r => r.status === 'DIE').length;
          const error = results.filter(r => r.status === 'ERROR').length;
          updateStats({ total: results.length, checked: results.length, live, die, error });
        }
        if (state.intervalSeconds) {
          autoLoopInterval.value = state.intervalSeconds;
        }
        if (state.loopCount) {
          loopCount = state.loopCount;
          loopCounter.textContent = `#${loopCount}`;
        }
        if (state.lastCheckTime && state.lastCheckTime !== 'Chưa quét') {
          lastCheckTime.textContent = state.lastCheckTime;
        }
        if (state.autoLoop) {
          autoLoopToggle.checked = true;
          onAutoLoopToggleChange();
        }
      }
    } catch (e) {
      console.error('Error restoring state:', e);
    }
  }

  // 7. Input Formatting & Line Counter
  function updateInputCount() {
    const lines = extractUsernames(usernamesInput.value);
    inputCountText.textContent = `${lines.length} tài khoản hợp lệ đã nhập`;
    scheduleAutoSave();
  }

  usernamesInput.addEventListener('input', updateInputCount);

  btnClearInput.addEventListener('click', () => {
    usernamesInput.value = '';
    updateInputCount();
    scheduleAutoSave();
  });

  // Sample data button
  const SAMPLE_ACCOUNTS = [
    'cristiano',
    'selenagomez',
    '@taylorswift',
    'https://www.instagram.com/apple/',
    'die_account_test_not_exist_98124',
    'leomessi',
    'nike',
    'vietnam',
    'another_fake_acc_xyz_881'
  ];

  btnSampleData.addEventListener('click', () => {
    usernamesInput.value = SAMPLE_ACCOUNTS.join('\n');
    updateInputCount();
    showToast('Đã tải danh sách mẫu!');
    scheduleAutoSave();
  });

  // File import (.txt, .csv)
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
      usernamesInput.value = lines.join('\n');
      updateInputCount();
      showToast(`Đã nhập ${lines.length} tài khoản từ file ${file.name}`);
      fileInput.value = '';
      scheduleAutoSave();
    };
    reader.readAsText(file);
  });

  function extractUsernames(rawText) {
    if (!rawText) return [];
    return rawText
      .split(/[\r\n,;]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        let u = line.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '');
        u = u.split('?')[0].split('/')[0];
        u = u.replace(/^@+/, '').trim();
        return u;
      })
      .filter(Boolean);
  }

  // 8. Batch Check Execution (Supports In-Place Updates for Auto-Loop)
  async function runBatchCheck(isAutoLoop = false) {
    if (isRunning) return;

    const rawList = extractUsernames(usernamesInput.value);
    const list = [...new Set(rawList)];

    if (list.length === 0) {
      if (!isAutoLoop) {
        showToast('Vui lòng nhập ít nhất 1 tài khoản Instagram!', 'error');
        usernamesInput.focus();
      }
      return;
    }

    const previousMap = new Map();
    results.forEach(r => {
      previousMap.set(r.username, r.followers);
    });

    isRunning = true;
    btnStartBatch.disabled = true;
    btnStopBatch.disabled = false;
    progressSection.classList.remove('hidden');
    progressSpinner.classList.remove('hidden');
    progressBarFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressStatusText.textContent = isAutoLoop
      ? `Đang tự động cập nhật vòng #${loopCount} (${list.length} tài khoản)...`
      : `Đang kiểm tra ${list.length} tài khoản...`;

    abortController = new AbortController();

    const concurrency = parseInt(concurrencySelect.value) || 2;
    const delayMs = parseInt(delaySelect.value) || 300;

    let totalCheckedInRound = 0;
    let newResultsMap = new Map();
    results.forEach(r => newResultsMap.set(r.username, r));

    try {
      const response = await fetch('/api/check-batch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          usernames: list,
          concurrency,
          delayMs
        }),
        signal: abortController.signal
      });

      if (response.status === 401) {
        showLicenseModal('License Key không hợp lệ hoặc đã hết hạn!');
        return;
      }

      if (!response.ok) {
        throw new Error(`Máy chủ phản hồi mã: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'progress') {
              const item = data.item;
              item.previousFollowers = previousMap.get(item.username) || item.followers;
              item.lastUpdated = new Date().toLocaleTimeString('vi-VN');

              newResultsMap.set(item.username, item);
              results = Array.from(newResultsMap.values());

              totalCheckedInRound++;
              renderTable();

              const live = results.filter(r => r.status === 'LIVE').length;
              const die = results.filter(r => r.status === 'DIE').length;
              const error = results.filter(r => r.status === 'ERROR').length;
              updateStats({ total: list.length, checked: totalCheckedInRound, live, die, error });

              const percent = Math.round((data.stats.checked / data.stats.total) * 100);
              progressBarFill.style.width = `${percent}%`;
              progressPercent.textContent = `${percent}%`;
              progressStatusText.textContent = `Đang cập nhật: ${data.stats.checked}/${data.stats.total} (${item.username})`;

              scheduleAutoSave();
            } else if (data.type === 'done') {
              const live = results.filter(r => r.status === 'LIVE').length;
              const die = results.filter(r => r.status === 'DIE').length;
              const error = results.filter(r => r.status === 'ERROR').length;
              updateStats({ total: list.length, checked: list.length, live, die, error });

              const nowTime = new Date().toLocaleTimeString('vi-VN');
              lastCheckTime.textContent = nowTime;
              progressStatusText.textContent = `Hoàn tất cập nhật lúc ${nowTime}! (Live: ${live}, Die: ${die})`;
              progressBarFill.style.width = '100%';
              progressPercent.textContent = '100%';

              saveStateToBackend();
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        progressStatusText.textContent = 'Đã dừng kiểm tra theo yêu cầu.';
        showToast('Đã dừng kiểm tra!');
      } else {
        progressStatusText.textContent = `Lỗi: ${err.message}`;
        showToast(`Lỗi: ${err.message}`, 'error');
      }
    } finally {
      isRunning = false;
      btnStartBatch.disabled = false;
      btnStopBatch.disabled = true;
      progressSpinner.classList.add('hidden');
    }
  }

  btnStartBatch.addEventListener('click', () => {
    loopCount++;
    loopCounter.textContent = `#${loopCount}`;
    runBatchCheck(false);
  });

  btnStopBatch.addEventListener('click', () => {
    if (abortController) {
      abortController.abort();
    }
  });

  // 9. Auto-Loop Engine (1 minute interval by default)
  function onAutoLoopToggleChange() {
    const isEnabled = autoLoopToggle.checked;
    scheduleAutoSave();

    if (isEnabled) {
      autoLoopCard.classList.add('active-monitoring');
      autoLoopStatusBadge.className = 'badge-status-active';
      autoLoopStatusBadge.textContent = 'Đang giám sát';
      autoLoopSwitchLabel.textContent = 'Đang bật tự động';
      showToast('Đã BẬT chế độ tự động cập nhật liên tục!');
      startCountdownTimer();
    } else {
      autoLoopCard.classList.remove('active-monitoring');
      autoLoopStatusBadge.className = 'badge-status-inactive';
      autoLoopStatusBadge.textContent = 'Đang tắt';
      autoLoopSwitchLabel.textContent = 'Bật tự động quét';
      countdownStatus.textContent = 'Tự động quét đang tắt';
      countdownTime.textContent = '--';
      clearInterval(countdownTimer);
      showToast('Đã TẮT chế độ tự động cập nhật!');
    }
  }

  function startCountdownTimer() {
    clearInterval(countdownTimer);
    const intervalSec = parseInt(autoLoopInterval.value) || 60;
    countdownSeconds = intervalSec;
    updateCountdownDisplay();

    countdownTimer = setInterval(() => {
      if (!autoLoopToggle.checked) {
        clearInterval(countdownTimer);
        return;
      }

      if (isRunning) {
        countdownStatus.textContent = 'Đang quét dữ liệu...';
        return;
      }

      countdownSeconds--;
      updateCountdownDisplay();

      if (countdownSeconds <= 0) {
        countdownSeconds = parseInt(autoLoopInterval.value) || 60;
        loopCount++;
        loopCounter.textContent = `#${loopCount}`;
        runBatchCheck(true);
      }
    }, 1000);
  }

  function updateCountdownDisplay() {
    countdownTime.textContent = `${countdownSeconds}s`;
    countdownStatus.textContent = `Quét lại sau: ${countdownSeconds}s`;
  }

  autoLoopToggle.addEventListener('change', onAutoLoopToggleChange);

  autoLoopInterval.addEventListener('change', () => {
    scheduleAutoSave();
    if (autoLoopToggle.checked) {
      startCountdownTimer();
      showToast(`Đã đổi chu kỳ quét: ${autoLoopInterval.options[autoLoopInterval.selectedIndex].text}`);
    }
  });

  btnTriggerNow.addEventListener('click', () => {
    loopCount++;
    loopCounter.textContent = `#${loopCount}`;
    runBatchCheck(true);
    if (autoLoopToggle.checked) {
      startCountdownTimer();
    }
  });

  // 10. Stats & Table Rendering
  function updateStats(stats) {
    statTotal.textContent = stats.total || 0;
    statLive.textContent = stats.live || 0;
    statDie.textContent = stats.die || 0;
    statError.textContent = stats.error || 0;

    const checked = stats.checked || 0;
    const rate = checked > 0 ? Math.round(((stats.live || 0) / checked) * 100) : 0;
    statRate.textContent = `${rate}%`;

    filterAllCount.textContent = results.length;
    filterLiveCount.textContent = results.filter(r => r.status === 'LIVE').length;
    filterDieCount.textContent = results.filter(r => r.status === 'DIE').length;
    filterErrorCount.textContent = results.filter(r => r.status === 'ERROR').length;
  }

  function getTableRowHtml(item, index) {
    let statusBadge = '';
    if (item.status === 'LIVE') {
      statusBadge = `<span class="badge-status badge-live">● LIVE</span>`;
    } else if (item.status === 'DIE') {
      statusBadge = `<span class="badge-status badge-die">✕ DIE</span>`;
    } else {
      statusBadge = `<span class="badge-status badge-error">! ERROR</span>`;
    }

    const avatarHtml = item.avatar 
      ? `<img class="avatar-cell" src="${escapeHtml(item.avatar)}" alt="${escapeHtml(item.username)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'avatar-placeholder\\'>👤</div>';">`
      : `<div class="avatar-placeholder">👤</div>`;

    const verifiedBadge = item.isVerified
      ? `<svg class="verified-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`
      : '';

    const diffBadge = formatFollowersDiff(item.previousFollowers, item.followers);
    const updatedTime = item.lastUpdated || (item.checkedAt ? new Date(item.checkedAt).toLocaleTimeString('vi-VN') : '-');

    return `
      <td>${index}</td>
      <td>${avatarHtml}</td>
      <td>
        <div class="user-cell">
          <a class="user-link" href="${escapeHtml(item.profileUrl)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(item.username)}</a>
          ${verifiedBadge}
        </div>
      </td>
      <td>${escapeHtml(item.name || '-')}</td>
      <td>${statusBadge}</td>
      <td><span class="stat-number followers-highlight">${escapeHtml(item.followers || '-')}</span></td>
      <td>${diffBadge}</td>
      <td><span class="stat-number">${escapeHtml(item.following || '-')}</span></td>
      <td><span class="stat-number">${escapeHtml(item.posts || '-')}</span></td>
      <td><span class="time-cell">${escapeHtml(updatedTime)}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="window.copyAccountInfo('${escapeHtml(item.username)}')" title="Sao chép tên">
            📋
          </button>
          <a class="btn btn-outline btn-sm" href="${escapeHtml(item.profileUrl)}" target="_blank" title="Mở trang cá nhân">
            🔗
          </a>
        </div>
      </td>
    `;
  }

  function matchesFilterAndSearch(item) {
    if (currentFilter !== 'all' && item.status !== currentFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const u = (item.username || '').toLowerCase();
      const n = (item.name || '').toLowerCase();
      if (!u.includes(q) && !n.includes(q)) return false;
    }
    return true;
  }

  function renderTable() {
    resultsTableBody.innerHTML = '';
    const filtered = results.filter(matchesFilterAndSearch);

    if (filtered.length === 0) {
      resultsTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="11">
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg>
              <p>Không tìm thấy kết quả phù hợp</p>
              <span>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.id = `row-${item.username}`;
      tr.innerHTML = getTableRowHtml(item, idx + 1);
      resultsTableBody.appendChild(tr);
    });
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });

  // Search Input
  tableSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderTable();
  });

  // 11. Quick Copy & Export Actions
  btnCopyLive.addEventListener('click', () => {
    const liveUsers = results.filter(r => r.status === 'LIVE').map(r => r.username);
    if (liveUsers.length === 0) {
      showToast('Không có tài khoản LIVE nào!', 'error');
      return;
    }
    copyToClipboard(liveUsers.join('\n'));
    showToast(`Đã sao chép ${liveUsers.length} tài khoản LIVE!`);
  });

  btnCopyDie.addEventListener('click', () => {
    const dieUsers = results.filter(r => r.status === 'DIE').map(r => r.username);
    if (dieUsers.length === 0) {
      showToast('Không có tài khoản DIE nào!', 'error');
      return;
    }
    copyToClipboard(dieUsers.join('\n'));
    showToast(`Đã sao chép ${dieUsers.length} tài khoản DIE!`);
  });

  btnCopyAll.addEventListener('click', () => {
    if (results.length === 0) {
      showToast('Chưa có dữ liệu!', 'error');
      return;
    }
    const formatted = results.map(r => `${r.username}\t${r.status}\t${r.followers}\t${r.following}\t${r.posts}`).join('\n');
    copyToClipboard(formatted);
    showToast(`Đã sao chép toàn bộ ${results.length} tài khoản!`);
  });

  // Export CSV
  btnExportCSV.addEventListener('click', () => {
    if (results.length === 0) {
      showToast('Chưa có kết quả để xuất file!', 'error');
      return;
    }
    const headers = ['STT', 'Username', 'Trạng Thái', 'Tên Hiển Thị', 'Followers', 'Following', 'Posts', 'Cập Nhật Gần Nhất', 'Link Profile'];
    const rows = results.map((r, i) => [
      i + 1,
      `"${r.username}"`,
      `"${r.status}"`,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${r.followers}"`,
      `"${r.following}"`,
      `"${r.posts}"`,
      `"${r.lastUpdated || r.checkedAt || ''}"`,
      `"${r.profileUrl}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    downloadFile(csvContent, `instagram_check_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    showToast('Đã xuất file CSV thành công!');
  });

  // Export JSON
  btnExportJSON.addEventListener('click', () => {
    if (results.length === 0) {
      showToast('Chưa có kết quả để xuất JSON!', 'error');
      return;
    }
    const jsonStr = JSON.stringify(results, null, 2);
    downloadFile(jsonStr, `instagram_check_${Date.now()}.json`, 'application/json');
    showToast('Đã xuất file JSON thành công!');
  });

  // Clear Results
  btnClearResults.addEventListener('click', () => {
    if (results.length === 0) return;
    if (confirm('Bạn có chắc muốn xóa toàn bộ danh sách kết quả?')) {
      results = [];
      renderTable();
      updateStats({ total: 0, checked: 0, live: 0, die: 0, error: 0 });
      progressSection.classList.add('hidden');
      scheduleAutoSave();
      showToast('Đã xóa danh sách kết quả!');
    }
  });

  // 12. Single Account Check Form
  singleCheckForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawVal = singleUsernameInput.value.trim();
    if (!rawVal) return;

    btnSingleSubmit.disabled = true;
    singleSpinner.classList.remove('hidden');
    singleResultCard.classList.add('hidden');

    try {
      const res = await fetch('/api/check-single', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username: rawVal })
      });

      if (res.status === 401) {
        showLicenseModal('License Key không hợp lệ hoặc đã hết hạn!');
        return;
      }

      const data = await res.json();
      renderSingleResult(data);
    } catch (err) {
      showToast(`Lỗi: ${err.message}`, 'error');
    } finally {
      btnSingleSubmit.disabled = false;
      singleSpinner.classList.add('hidden');
    }
  });

  function renderSingleResult(item) {
    singleResultCard.classList.remove('hidden');

    let statusBadge = '';
    if (item.status === 'LIVE') {
      statusBadge = `<span class="badge-status badge-live" style="font-size:13px;padding:5px 14px;">● TÀI KHOẢN HOẠT ĐỘNG (LIVE)</span>`;
    } else if (item.status === 'DIE') {
      statusBadge = `<span class="badge-status badge-die" style="font-size:13px;padding:5px 14px;">✕ KHÔNG TỒN TẠI / BỊ KHÓA (DIE)</span>`;
    } else {
      statusBadge = `<span class="badge-status badge-error" style="font-size:13px;padding:5px 14px;">! LỖI: ${escapeHtml(item.error || 'Timeout')}</span>`;
    }

    const avatarHtml = item.avatar 
      ? `<img class="single-avatar" src="${escapeHtml(item.avatar)}" alt="${escapeHtml(item.username)}" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23888\\' stroke-width=\\'1.5\\'><circle cx=\\'12\\' cy=\\'7\\' r=\\'4\\'/><path d=\\'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\\'/></svg>';">`
      : `<div class="single-avatar" style="display:flex;align-items:center;justify-content:center;font-size:32px;">👤</div>`;

    const verifiedBadge = item.isVerified
      ? `<svg class="verified-icon" style="width:20px;height:20px;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`
      : '';

    singleResultCard.innerHTML = `
      <div class="single-profile-header">
        ${avatarHtml}
        <div class="single-profile-info">
          <div class="single-profile-title">
            <h3 class="single-name">${escapeHtml(item.name || item.username)}</h3>
            ${verifiedBadge}
            ${statusBadge}
          </div>
          <div class="single-username">@${escapeHtml(item.username)}</div>
        </div>
      </div>

      <div class="single-stats-grid">
        <div class="single-stat-item">
          <div class="single-stat-num followers-highlight">${escapeHtml(item.followers || '0')}</div>
          <div class="single-stat-lbl">Người theo dõi (Followers)</div>
        </div>
        <div class="single-stat-item">
          <div class="single-stat-num">${escapeHtml(item.following || '0')}</div>
          <div class="single-stat-lbl">Đang theo dõi (Following)</div>
        </div>
        <div class="single-stat-item">
          <div class="single-stat-num">${escapeHtml(item.posts || '0')}</div>
          <div class="single-stat-lbl">Bài viết (Posts)</div>
        </div>
      </div>

      <div class="single-card-actions">
        <a href="${escapeHtml(item.profileUrl)}" target="_blank" class="btn btn-primary" style="flex:1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Mở trang cá nhân trên Instagram
        </a>
        <button class="btn btn-outline" onclick="window.copyAccountInfo('${escapeHtml(item.username)}')">
          📋 Sao chép username
        </button>
      </div>
    `;
  }

  // 13. Helpers
  function showToast(msg, type = 'success') {
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.borderLeftColor = type === 'error' ? 'var(--color-die)' : 'var(--color-live)';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  window.copyAccountInfo = function(username) {
    copyToClipboard(username);
    showToast(`Đã sao chép @${username}`);
  };

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 14. Initialize on Startup
  (async function init() {
    // Check saved license key
    if (activeLicenseKey) {
      const ok = await verifyLicenseKey(activeLicenseKey, false);
      if (ok) {
        await loadStateFromBackend();
      }
    } else {
      showLicenseModal();
    }
  })();
});
