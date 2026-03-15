document.addEventListener('DOMContentLoaded', () => {
    let map = null;
    let mapMarkers = [];
    
    // --- NAVIGATION & SWIPE LOGIC ---
    const tabs = ['explore-section', 'map-section', 'history-section'];
    const navItems = document.querySelectorAll('.nav-item');
    const mainArea = document.getElementById('content-area');
    
    function switchTab(targetId) {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (targetNav) targetNav.classList.add('active');
        document.getElementById(targetId).classList.add('active');

        if (targetId === 'map-section' && map) {
            setTimeout(() => map.invalidateSize(), 100);
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.target));
    });

    let touchstartX = 0;
    let touchendX = 0;

    mainArea.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; }, { passive: true });
    mainArea.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const diffX = touchendX - touchstartX;
        if (Math.abs(diffX) < 50) return;

        const currentActive = document.querySelector('.tab-content.active');
        const currentIndex = tabs.indexOf(currentActive.id);

        if (diffX < 0 && currentIndex < tabs.length - 1) {
            switchTab(tabs[currentIndex + 1]);
        } else if (diffX > 0 && currentIndex > 0) {
            switchTab(tabs[currentIndex - 1]);
        }
    }

    // --- CAMERA LOGIC ---
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('snapshot-canvas');
    const toggleCameraBtn = document.getElementById('toggle-camera-btn');
    const cameraOverlay = document.getElementById('camera-overlay');
    const cameraStatusText = document.getElementById('camera-status-text');
    const iconCircle = document.querySelector('.icon-circle');
    let currentStream = null;

    toggleCameraBtn.addEventListener('click', async () => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
            video.style.display = 'none';
            cameraOverlay.style.background = 'rgba(0,0,0,0.4)';
            cameraStatusText.style.display = 'block';
            iconCircle.style.display = 'flex';
            toggleCameraBtn.innerText = 'Turn On';
            toggleCameraBtn.style.position = 'static'; 
        } else {
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = currentStream;
                video.style.display = 'block';
                await video.play();
                
                cameraOverlay.style.background = 'transparent';
                cameraStatusText.style.display = 'none';
                iconCircle.style.display = 'none';
                toggleCameraBtn.innerText = 'Turn Off';
                toggleCameraBtn.style.position = 'absolute';
                toggleCameraBtn.style.bottom = '20px';
                toggleCameraBtn.style.right = '20px';
                toggleCameraBtn.style.padding = '10px 16px'; 
            } catch (err) {
                console.error("Camera error:", err);
                alert("Camera access denied or unavailable.");
            }
        }
    });

    // --- CAPTURE & UPLOAD ---
    document.getElementById('upload-btn').addEventListener('click', () => { document.getElementById('image-upload').click(); });
    document.getElementById('image-upload').addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => analyzeImage(event.target.result);
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    document.getElementById('capture-btn').addEventListener('click', () => {
        if (!currentStream) {
            alert("Please turn on the camera first, or use the upload button.");
            return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        analyzeImage(canvas.toDataURL('image/jpeg'));
    });

    // --- CORE AI PIPELINE ---
    async function analyzeImage(base64Image) {
        const resultCard = document.getElementById('result-card');
        resultCard.classList.remove('hidden');
        document.getElementById('location-name').innerText = "Scanning...";
        document.getElementById('tour-script').innerText = "Analyzing historical records...";
        document.getElementById('video-container').classList.add('hidden');

        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            document.getElementById('location-name').innerText = data.location;
            document.getElementById('tour-script').innerText = data.script;
            playTTS(data.script);
            
            updateMap(data);
            addToHistory(data.location, data.script);

            generateVideoStory(data.location, data.era, data.visual_scene);

        } catch (error) {
            console.error(error);
            document.getElementById('location-name').innerText = "Unrecognized";
            document.getElementById('tour-script').innerText = "Could not identify this location. Please try scanning a clearer view.";
        }
    }

    // --- TEXT-TO-SPEECH (Pleasant Voice Updates) ---
    function playTTS(text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Search for pleasant, natural-sounding female voices standard on most devices
        const voices = window.speechSynthesis.getVoices();
        const pleasantVoice = voices.find(v => 
            v.name.includes('Samantha') || 
            v.name.includes('Google UK English Female') || 
            v.name.includes('Google US English') ||
            v.name.includes('Victoria') ||
            v.name.includes('Karen')
        );
        
        if (pleasantVoice) utterance.voice = pleasantVoice;

        utterance.rate = 0.95; // Slightly slower, more deliberate pacing
        utterance.pitch = 1.05; // Slightly elevated pitch for warmth
        window.speechSynthesis.speak(utterance);
    }
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };

    // --- LEAFLET MAP (With Rich Descriptions) ---
    function updateMap(data) {
        document.getElementById('map-hint').innerText = "Tap a pin to explore details.";

        if (!map) {
            map = L.map('map-container').setView([data.lat, data.lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        } else {
            map.flyTo([data.lat, data.lng], 15);
        }

        mapMarkers.forEach(marker => map.removeLayer(marker));
        mapMarkers = [];

        // Center location marker
        const mainPopupHTML = `<div class="popup-title">${data.location}</div><div class="popup-desc">Your current location.</div>`;
        const mainMarker = L.marker([data.lat, data.lng]).addTo(map).bindPopup(mainPopupHTML).openPopup();
        mapMarkers.push(mainMarker);

        // Nearby location markers with descriptions
        data.nearby.forEach(place => {
            const popupHTML = `
                <div class="popup-title">${place.name}</div>
                <div class="popup-desc">${place.description || 'Nearby Attraction'}</div>
            `;
            const marker = L.marker([place.lat, place.lng]).addTo(map).bindPopup(popupHTML);
            mapMarkers.push(marker);
        });
    }

    // --- ASYNC VEO POLLING ---
    async function generateVideoStory(location, era, visual_scene) {
        const videoElement = document.getElementById('story-video');
        document.getElementById('video-container').classList.remove('hidden');
        
        videoElement.removeAttribute('src');
        videoElement.poster = "https://via.placeholder.com/400x225/1C1C1E/FFFFFF?text=Rendering+History...";

        try {
            const startRes = await fetch('/api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location, era, visual_scene })
            });
            const startData = await startRes.json();
            const jobId = startData.job_id;

            const pollInterval = setInterval(async () => {
                const statusRes = await fetch(`/api/video-status/${jobId}`);
                const statusData = await statusRes.json();

                if (statusData.status === 'done') {
                    clearInterval(pollInterval);
                    videoElement.poster = "";
                    videoElement.src = statusData.url;
                    videoElement.play();
                } else if (statusData.status === 'failed') {
                    clearInterval(pollInterval);
                    videoElement.poster = "https://via.placeholder.com/400x225/1C1C1E/ff4444?text=Generation+Failed";
                }
            }, 5000);

        } catch (error) {
            console.error("Video API Error:", error);
        }
    }

    // --- HISTORY ---
    function addToHistory(location, script) {
        const historyList = document.getElementById('history-list');
        if (historyList.querySelector('p.hint-text')) historyList.innerHTML = ''; 
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `<strong>${location}</strong><span>${script}</span>`;
        historyList.prepend(historyItem);
    }
});