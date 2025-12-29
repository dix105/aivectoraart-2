document.addEventListener('DOMContentLoaded', () => {
    
    /* =========================================
       1. Mobile Menu Toggle
       ========================================= */
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    /* =========================================
       2. Scroll Reveal Animation
       ========================================= */
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.observe(el);
    });

    /* =========================================
       3. FAQ Accordion
       ========================================= */
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = question.classList.contains('active');
            
            // Close all others
            faqQuestions.forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.style.maxHeight = null;
            });
            
            // Toggle current
            if (!isOpen) {
                question.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    /* =========================================
       4. Modals (Privacy & Terms)
       ========================================= */
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const modalClosers = document.querySelectorAll('[data-modal-close]');
    
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    }
    
    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(trigger.dataset.modalTarget);
        });
    });
    
    modalClosers.forEach(closer => {
        closer.addEventListener('click', () => {
            const modal = closer.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close on click outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    /* =========================================
       5. REAL API INTEGRATION & LOGIC
       ========================================= */
    
    // Select Elements
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    // Configuration
    const API_CONFIG = {
        userId: 'DObRu1vyStbUynoQmTcHBlhs55z2',
        effectId: 'photoToVectorArt',
        model: 'image-effects',
        toolType: 'image-effects'
    };

    // State
    let currentUploadedUrl = null;

    /* --- HELPER FUNCTIONS --- */

    // Generate nanoid for unique filename
    function generateNanoId(length = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // UI Helpers
    function showLoading() {
        const loader = document.getElementById('loading-state');
        const resultContainer = document.getElementById('result-container') || document.querySelector('.result-display');
        const placeholder = document.querySelector('.result-placeholder');
        
        if (loader) loader.classList.remove('hidden');
        if (loader) loader.style.display = 'flex';
        
        if (placeholder) placeholder.classList.add('hidden');
        
        // Hide result image while loading
        const resultImg = document.getElementById('result-final');
        if (resultImg) resultImg.classList.add('hidden');
    }

    function hideLoading() {
        const loader = document.getElementById('loading-state');
        if (loader) {
            loader.classList.add('hidden');
            loader.style.display = 'none';
        }
    }

    function updateStatus(text) {
        // Update any status text element if exists
        const statusText = document.getElementById('status-text') || document.querySelector('.status-text');
        if (statusText) statusText.textContent = text;
        
        // Update button text state
        if (generateBtn) {
            if (text.includes('PROCESSING') || text.includes('UPLOADING') || text.includes('SUBMITTING')) {
                generateBtn.disabled = true;
                generateBtn.textContent = text;
            } else if (text === 'READY') {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Vector Art';
            } else if (text === 'COMPLETE') {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Again';
            }
        }
    }

    function showError(msg) {
        alert('Error: ' + msg); 
        console.error(msg);
    }

    function showPreview(url) {
        const img = document.getElementById('preview-image');
        if (img) {
            img.src = url;
            img.classList.remove('hidden');
            img.style.display = 'block';
        }
        // Hide placeholder text if exists inside upload zone
        // Fallback to generic 'p' if .placeholder-text is missing
        const placeholder = document.querySelector('#upload-zone .placeholder-text') || document.querySelector('#upload-zone p');
        if (placeholder) placeholder.style.display = 'none';
        
        // Also hide the upload icon/text if they are separate
        const uploadContent = document.querySelector('#upload-zone .upload-content');
        if (uploadContent && img) {
             // Position image absolutely over content or hide content
             // For this structure, we just ensure image is visible
        }
    }

    function showResultMedia(url) {
        const resultImg = document.getElementById('result-final');
        const container = document.getElementById('result-container') || document.querySelector('.result-area');
        
        if (!container) return;
        
        // For Vector Art (image-effects), it's always an image
        if (resultImg) {
            resultImg.classList.remove('hidden');
            resultImg.style.display = 'block';
            resultImg.crossOrigin = 'anonymous';
            resultImg.src = url;
        }
    }

    function showDownloadButton(url) {
        if (downloadBtn) {
            downloadBtn.dataset.url = url;
            downloadBtn.classList.remove('disabled');
            downloadBtn.removeAttribute('disabled');
            downloadBtn.style.display = 'inline-block';
        }
    }

    function enableGenerateButton() {
        if (generateBtn) {
            generateBtn.disabled = false;
        }
    }

    /* --- API FUNCTIONS --- */

    // Upload file to CDN storage (called immediately when file is selected)
    async function uploadFile(file) {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueId = generateNanoId();
        // Filename is just nanoid.extension
        const fileName = uniqueId + '.' + fileExtension;
        
        // Step 1: Get signed URL from API
        const signedUrlResponse = await fetch(
            'https://api.chromastudio.ai/get-emd-upload-url?fileName=' + encodeURIComponent(fileName),
            { method: 'GET' }
        );
        
        if (!signedUrlResponse.ok) {
            throw new Error('Failed to get signed URL: ' + signedUrlResponse.statusText);
        }
        
        const signedUrl = await signedUrlResponse.text();
        console.log('Got signed URL');
        
        // Step 2: PUT file to signed URL
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file: ' + uploadResponse.statusText);
        }
        
        // Step 3: Return download URL
        const downloadUrl = 'https://contents.maxstudio.ai/' + fileName;
        console.log('Uploaded to:', downloadUrl);
        return downloadUrl;
    }

    // Submit generation job
    async function submitImageGenJob(imageUrl) {
        const isVideo = API_CONFIG.model === 'video-effects'; // false for photoToVectorArt
        const endpoint = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0'
        };

        let body = {};
        if (isVideo) {
            // Not applicable for this effect, but kept for robustness based on prompt
            body = {
                imageUrl: [imageUrl],
                effectId: API_CONFIG.effectId,
                userId: API_CONFIG.userId,
                removeWatermark: true,
                model: 'video-effects',
                isPrivate: true
            };
        } else {
            body = {
                model: API_CONFIG.model,
                toolType: API_CONFIG.toolType,
                effectId: API_CONFIG.effectId,
                imageUrl: imageUrl,
                userId: API_CONFIG.userId,
                removeWatermark: true,
                isPrivate: true
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit job: ' + response.statusText);
        }
        
        const data = await response.json();
        console.log('Job submitted:', data.jobId, 'Status:', data.status);
        return data;
    }

    // Poll job status
    async function pollJobStatus(jobId) {
        const isVideo = API_CONFIG.model === 'video-effects';
        const baseUrl = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        const POLL_INTERVAL = 2000;
        const MAX_POLLS = 60;
        let polls = 0;
        
        while (polls < MAX_POLLS) {
            const response = await fetch(
                `${baseUrl}/${API_CONFIG.userId}/${jobId}/status`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to check status: ' + response.statusText);
            }
            
            const data = await response.json();
            console.log('Poll', polls + 1, '- Status:', data.status);
            
            if (data.status === 'completed') {
                return data;
            }
            
            if (data.status === 'failed' || data.status === 'error') {
                throw new Error(data.error || 'Job processing failed');
            }
            
            updateStatus('PROCESSING... (' + (polls + 1) + ')');
            
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            polls++;
        }
        
        throw new Error('Job timed out after ' + MAX_POLLS + ' polls');
    }

    /* --- EVENT HANDLERS --- */

    async function handleFileSelect(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        try {
            showLoading(); // Show loading on result area (or upload area)
            
            // Show local preview immediately if possible, or wait for upload
            // We use the uploaded URL for preview to be safe, but can use FileReader for instant feedback
            const reader = new FileReader();
            reader.onload = (e) => showPreview(e.target.result);
            reader.readAsDataURL(file);

            updateStatus('UPLOADING...');
            
            // Upload immediately
            const uploadedUrl = await uploadFile(file);
            currentUploadedUrl = uploadedUrl;
            
            // Ensure preview uses the remote URL just in case
            // showPreview(uploadedUrl);
            
            updateStatus('READY');
            hideLoading();
            enableGenerateButton();
            
        } catch (error) {
            hideLoading();
            updateStatus('ERROR');
            showError(error.message);
        }
    }

    async function handleGenerate() {
        if (!currentUploadedUrl) {
            alert('Please upload an image first.');
            return;
        }
        
        try {
            showLoading();
            updateStatus('SUBMITTING JOB...');
            
            // 1. Submit
            const jobData = await submitImageGenJob(currentUploadedUrl);
            updateStatus('JOB QUEUED...');
            
            // 2. Poll
            const result = await pollJobStatus(jobData.jobId);
            
            // 3. Extract Result
            const resultItem = Array.isArray(result.result) ? result.result[0] : result.result;
            const resultUrl = resultItem?.mediaUrl || resultItem?.video || resultItem?.image;
            
            if (!resultUrl) {
                console.error('Response:', result);
                throw new Error('No image URL in response');
            }
            
            console.log('Result image URL:', resultUrl);
            
            // 4. Update UI
            // currentUploadedUrl = resultUrl; // Optional: Allow re-gen on result? Usually not for this flow.
            showResultMedia(resultUrl);
            updateStatus('COMPLETE');
            hideLoading();
            showDownloadButton(resultUrl);
            
        } catch (error) {
            hideLoading();
            updateStatus('ERROR');
            showError(error.message);
        }
    }

    /* --- WIRING --- */

    // File Input
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileSelect(file);
        });
    }

    // Upload Zone
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--secondary)';
            uploadZone.style.background = 'rgba(138, 43, 226, 0.1)';
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        });
        
        // Click to upload
        uploadZone.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    // Generate Button
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }

    // Reset Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentUploadedUrl = null;
            
            // Clear Input
            if (fileInput) fileInput.value = '';
            
            // Hide Preview
            const previewImage = document.getElementById('preview-image');
            if (previewImage) {
                previewImage.src = '';
                previewImage.classList.add('hidden');
                previewImage.style.display = 'none';
            }
            
            // Restore Placeholder
            const placeholder = document.querySelector('.result-placeholder');
            if (placeholder) placeholder.classList.remove('hidden');
            
            // Fallback to generic 'p' if .placeholder-text is missing
            const uploadText = document.querySelector('#upload-zone .placeholder-text') || document.querySelector('#upload-zone p');
            if (uploadText) uploadText.style.display = 'block';

            // Clear Result
            const resultImg = document.getElementById('result-final');
            if (resultImg) {
                resultImg.src = '';
                resultImg.classList.add('hidden');
            }
            
            // Reset Buttons
            if (downloadBtn) {
                downloadBtn.classList.add('disabled');
                downloadBtn.style.display = 'none'; // or whatever initial state was
            }
            if (generateBtn) {
                generateBtn.textContent = 'Generate Vector Art';
                generateBtn.disabled = false; // Keep enabled if they want to upload new one? 
                // Usually disabled until file upload, but handleFileSelect enables it.
            }
            
            hideLoading();
        });
    }

    // Download Button - Robust Implementation
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent default link behavior if href is set
            
            const url = downloadBtn.dataset.url;
            if (!url) return;
            
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.classList.add('disabled'); // visual disable
            
            try {
                // Fetch blob to force download
                const response = await fetch(url, {
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (!response.ok) throw new Error('Network error');
                
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                // Determine extension
                const contentType = response.headers.get('content-type') || '';
                let extension = 'jpg';
                if (contentType.includes('png')) extension = 'png';
                if (contentType.includes('webp')) extension = 'webp';
                
                // Create temp link
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `vector-art_${generateNanoId(8)}.${extension}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                
            } catch (err) {
                console.error('Direct download failed, trying fallback', err);
                
                // Fallback: Canvas (only works for images if CORS allows)
                try {
                    const img = document.getElementById('result-final');
                    if (img && img.complete && img.naturalWidth > 0) {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = `vector-art_${generateNanoId(8)}.png`;
                                link.click();
                            } else {
                                throw new Error('Canvas blob failed');
                            }
                        }, 'image/png');
                        return; // Success
                    }
                } catch (canvasErr) {
                    console.error('Canvas fallback failed', canvasErr);
                }

                // Final Fallback: Open in new tab
                alert('Download started in new tab. Right-click image to save.');
                window.open(url, '_blank');
            } finally {
                downloadBtn.textContent = originalText;
                downloadBtn.classList.remove('disabled');
            }
        });
    }
});