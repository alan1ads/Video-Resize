document.addEventListener('DOMContentLoaded', function() {
    // Sample data - in a real app, you'd fetch this from your server
    let startTime = new Date();
    let videosProcessed = 0;
    
    // Update the uptime counter
    function updateUptime() {
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000); // seconds
        
        let days = Math.floor(diff / (24 * 60 * 60));
        let hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
        let minutes = Math.floor((diff % (60 * 60)) / 60);
        let seconds = diff % 60;
        
        let uptimeString = '';
        if (days > 0) uptimeString += `${days}d `;
        if (hours > 0 || days > 0) uptimeString += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) uptimeString += `${minutes}m `;
        uptimeString += `${seconds}s`;
        
        document.getElementById('uptime').textContent = uptimeString;
    }
    
    // Update videos processed count
    function updateVideosProcessed() {
        // In a real app, you would fetch this from your server
        // For demo purposes, we'll just increment it occasionally
        if (Math.random() < 0.1) {
            videosProcessed++;
            document.getElementById('videos-processed').textContent = videosProcessed;
        }
    }
    
    // Check connection status
    function checkStatus() {
        // In a real app, you would ping your server to check if it's online
        // For demo purposes, we'll just simulate it
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (Math.random() < 0.95) { // 95% chance of being online for demo
            statusDot.classList.remove('offline');
            statusDot.classList.add('online');
            statusText.textContent = 'Bot is online';
        } else {
            statusDot.classList.remove('online');
            statusDot.classList.add('offline');
            statusText.textContent = 'Bot is offline';
        }
    }
    
    // Initial updates
    updateUptime();
    document.getElementById('videos-processed').textContent = videosProcessed;
    
    // Set interval for updates
    setInterval(updateUptime, 1000);
    setInterval(updateVideosProcessed, 5000);
    setInterval(checkStatus, 10000);
}); 