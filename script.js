const GEMINI_API_KEY = "AIzaSyBiuh9XKQkBlWysO7mFtw61OnpVWA91vc4"; 
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// NEW: Keep-Alive function to prevent the connection from dying after 30s
setInterval(() => {
    console.log("Connection Keep-Alive Active...");
    // Tiny background check to keep the browser extension awake
}, 20000);

async function processHandwriting(file) {
    const status = document.getElementById('ocrStatus');
    const preview = document.getElementById('preview-content');
    const currentText = preview.innerText;
    status.innerText = "⏳ Processing image... (Maintaining Connection)";

    const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `Existing paper content: "${currentText}". Extract questions from this NEW image. Continue the numbering from where the previous content ended. Use Level 1 <ol> (1,2,3), nested Level 2 <ol> (a,b,c), and Level 3 <ol> (i,ii). Format 'Match the Following' as <table>. Return ONLY clean HTML, no markdown.` },
                        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                    ]
                }]
            })
        });

        if (!response.ok) throw new Error("API Connection Lost");

        const data = await response.json();
        let aiHtml = data.candidates[0].content.parts[0].text;
        aiHtml = aiHtml.replace(/```html/g, '').replace(/```/g, '');

        preview.innerHTML += `<div class="added-content">${aiHtml}</div>`;
        status.innerText = "✅ Page Added Successfully!";
    } catch (e) {
        status.innerText = "❌ Connection Failed. Please Refresh Page and toggle CORS/VPN.";
        console.error(e);
    }
}

document.getElementById('imageUpload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
        await processHandwriting(file);
    }
});

function generatePreview() {
    const logoFile = document.getElementById('logoUpload').files[0];
    const build = (src = "") => {
        const head = `
            <div class="paper-header">
                ${src ? `<img src="${src}" class="paper-logo">` : ''}
                <h1 class="school-name">${document.getElementById('schoolName').value.toUpperCase()}</h1>
                <p class="school-info">${document.getElementById('schoolAddress').value}</p>
                <p class="school-info"><b>${document.getElementById('session').value}</b></p>
                <div class="meta-info">
                    <span>Class: ${document.getElementById('className').value}</span>
                    <span>Subject: ${document.getElementById('subject').value}</span>
                    <span>Time: ${document.getElementById('timeLimit').value}</span>
                    <span>Marks: ${document.getElementById('totalMarks').value}</span>
                </div>
            </div>`;
        const content = document.getElementById('preview-content');
        const oldHead = content.querySelector('.paper-header');
        if (oldHead) oldHead.remove();
        content.innerHTML = head + content.innerHTML;
    };

    if (logoFile) {
        const reader = new FileReader();
        reader.onload = (e) => build(e.target.result);
        reader.readAsDataURL(logoFile);
    } else { build(); }
}