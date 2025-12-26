window.onload = function() {
    // Typewriter
    const text = "Welcome back to GHOSTOS user.";
    const typewriterElement = document.getElementById('typewriter-text');
    if (typewriterElement) typewriterElement.innerHTML = '';

    let index = 0;
    function typeText() {
        if (!typewriterElement) return;
        if (index < text.length) {
            typewriterElement.innerHTML += text.charAt(index);
            index++;
            setTimeout(typeText, 100);
        }
    }
    typeText();

    // Navigation toggle behavior
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    function closeMenu() {
        if (!navMenu || !navToggle) return;
        navMenu.classList.remove('open');
        navMenu.setAttribute('aria-hidden', 'true');
        navToggle.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
        if (!navMenu || !navToggle) return;
        navMenu.classList.add('open');
        navMenu.setAttribute('aria-hidden', 'false');
        navToggle.setAttribute('aria-expanded', 'true');
    }

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function (e) {
            const open = navMenu.classList.contains('open');
            if (open) closeMenu(); else openMenu();
            e.stopPropagation();
        });

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (!navMenu.contains(e.target) && e.target !== navToggle) {
                closeMenu();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });

        // Nav item handlers (basic)
        navMenu.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                closeMenu();
                console.log('Nav selected:', btn.textContent.trim());
            });
        });
    }

    // Top-bar live clock (12-hour format with date)
    const topClock = document.getElementById('top-clock');
    function pad(n) { return String(n).padStart(2,'0'); }
    function updateClock() {
        if (!topClock) return;
        const now = new Date();
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const month = months[now.getMonth()];
        const day = now.getDate();
        const year = now.getFullYear();
        let hours = now.getHours();
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        const hourStr = String(hour12).padStart(2,'0');
        topClock.textContent = `${month} ${day}, ${year} ${hourStr}:${minutes}:${seconds} ${ampm}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Launcher modal behavior
    const launcherBtn = document.querySelector('.app-card[data-app="launcher"]');
    const launcherModal = document.getElementById('launcher-modal');
    if (launcherBtn && launcherModal) {
        const modalBackdrop = launcherModal.querySelector('.modal-backdrop');
        const modalClose = launcherModal.querySelector('.modal-close');

        function openLauncher() {
            launcherModal.setAttribute('aria-hidden', 'false');
        }

        function closeLauncher() {
            launcherModal.setAttribute('aria-hidden', 'true');
        }

        launcherBtn.addEventListener('click', (e) => {
            openLauncher();
            e.stopPropagation();
        });

        if (modalClose) modalClose.addEventListener('click', () => closeLauncher());
        if (modalBackdrop) modalBackdrop.addEventListener('click', () => closeLauncher());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLauncher();
        });
    }

    // Wire nav menu 'Launcher' item to open the launcher modal (if present)
    (function bindNavLauncher() {
        const navLauncher = document.querySelector('.nav-item[data-action="launcher"]');
        if (!navLauncher) return;
        navLauncher.addEventListener('click', (e) => {
            // close nav menu if open
            if (navMenu && navMenu.classList.contains('open')) {
                closeMenu();
            }
            // open launcher modal if available
            const launcherBtnLocal = document.querySelector('.app-card[data-app="launcher"]');
            if (launcherBtnLocal) launcherBtnLocal.click();
            e.stopPropagation();
        });
    })();

    // File storage using IndexedDB
    const fileInput = document.getElementById('file-input');
    const dropArea = document.getElementById('drop-area');
    const fileList = document.getElementById('file-list');

    // Simple IndexedDB helper
    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('ghostos-files', 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function addFile(name, blob) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('files', 'readwrite');
            const store = tx.objectStore('files');
            const item = { name, blob, created: Date.now() };
            const r = store.add(item);
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        });
    }

    async function getAllFiles() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('files', 'readonly');
            const store = tx.objectStore('files');
            const r = store.getAll();
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        });
    }

    async function deleteFile(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('files', 'readwrite');
            const store = tx.objectStore('files');
            const r = store.delete(id);
            r.onsuccess = () => resolve();
            r.onerror = () => reject(r.error);
        });
    }

    function renderFiles(items) {
        if (!fileList) return;
        fileList.innerHTML = '';
        items.forEach(it => {
            const li = document.createElement('li');
            li.className = 'file-item';
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = it.name;
            const controls = document.createElement('div');
            const dl = document.createElement('a');
            dl.textContent = 'Download';
            dl.href = URL.createObjectURL(it.blob);
            dl.download = it.name;
            dl.style.marginRight = '8px';
            const del = document.createElement('button');
            del.textContent = 'Delete';
            del.addEventListener('click', async () => {
                await deleteFile(it.id);
                await refreshFileList();
            });
            controls.appendChild(dl);
            controls.appendChild(del);
            li.appendChild(meta);
            li.appendChild(controls);
            fileList.appendChild(li);
        });
    }

    async function refreshFileList() {
        const items = await getAllFiles();
        renderFiles(items);
    }

    // handle input/select
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files || []);
            for (const f of files) await addFile(f.name, f);
            fileInput.value = '';
            await refreshFileList();
        });
    }

    if (dropArea) {
        ['dragenter','dragover'].forEach(ev => dropArea.addEventListener(ev, (e) => { e.preventDefault(); dropArea.classList.add('dragover'); }));
        ['dragleave','drop'].forEach(ev => dropArea.addEventListener(ev, (e) => { e.preventDefault(); dropArea.classList.remove('dragover'); }));
        dropArea.addEventListener('drop', async (e) => {
            const dt = e.dataTransfer; if (!dt) return;
            const files = Array.from(dt.files || []);
            for (const f of files) await addFile(f.name, f);
            await refreshFileList();
        });
    }

    // wire choose-files button
    const chooseFilesBtn = document.getElementById('choose-files');
    if (chooseFilesBtn && fileInput) {
        chooseFilesBtn.addEventListener('click', () => fileInput.click());
    }

    // refresh list when launcher opens
    const openLauncherBtn = document.querySelector('.app-card[data-app="launcher"]');
    if (openLauncherBtn && launcherModal) {
        openLauncherBtn.addEventListener('click', () => refreshFileList());
    }
};

