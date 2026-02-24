// =============================================================================
// IDLE SCREEN VIDEO LIST
// To add or remove videos: simply update the array below with your video filenames
// Place your videos in: src/videos/idle-screen/
// =============================================================================
const IDLE_VIDEOS = [
  'Dialing in the shooter, one test at a time.mp4',
  'FieldDay.mp4',
  'Kickoff reel.mp4',
  'Mock kickoff 26.mp4',
  'New Season Building fun reel.mp4',
  'Robot CAD Review.mp4',
  'Robotics life.mp4',
  'Work hard play hard reel.mp4',
  'big dreams.mp4',
  'field build reel.mp4',
  'new season new possibilities.mp4',
  'prototype test revise repeat.mp4'
];

// Idle Screen Manager
class IdleScreenManager {
  constructor() {
    this.idleTimeout = 2 * 60 * 1000; // 2 minutes in milliseconds
    this.idleTimer = null;
    this.idleScreen = document.getElementById('idle-screen');
    this.idleVideo = document.getElementById('idle-video');
    this.currentVideoIndex = 0;
    this.videosDir = './src/videos/idle-screen/';

    // Build full video paths
    this.videos = IDLE_VIDEOS.map(filename => this.videosDir + filename);

    this.init();
  }

  init() {
    // Setup video ended event to play next video
    this.idleVideo.addEventListener('ended', () => {
      this.playNextVideo();
    });

    // Setup tap/click event to hide idle screen
    this.idleScreen.addEventListener('click', () => {
      this.hideIdleScreen();
    });

    // Track user activity
    this.setupActivityTracking();

    // Start the idle timer
    this.resetIdleTimer();
  }

  setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        if (!this.idleScreen.classList.contains('active')) {
          this.resetIdleTimer();
        }
      }, true);
    });
  }

  resetIdleTimer() {
    // Clear existing timer
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    // Set new timer
    this.idleTimer = setTimeout(() => {
      this.showIdleScreen();
    }, this.idleTimeout);
  }

  showIdleScreen() {
    // Don't show idle screen if no videos are available
    if (this.videos.length === 0) {
      console.warn('No videos available for idle screen');
      return;
    }

    // Reset to home section
    if (typeof switchSection === 'function') {
      switchSection('home');
    }

    // Start playing videos
    this.currentVideoIndex = 0;
    this.playVideo(this.currentVideoIndex);

    // Show the idle screen
    this.idleScreen.classList.add('active');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      window.updateNavOffset?.();
    });
  }

  hideIdleScreen() {
    // Hide the idle screen
    this.idleScreen.classList.remove('active');
    document.body.style.overflow = '';

    // Pause the video
    this.idleVideo.pause();

    requestAnimationFrame(() => {
      window.updateNavOffset?.();
    });

    // Reset the idle timer
    this.resetIdleTimer();
  }

  playVideo(index) {
    if (index >= 0 && index < this.videos.length) {
      this.idleVideo.src = this.videos[index];
      this.idleVideo.load();
      this.idleVideo.play().catch(err => {
        console.error('Error playing video:', err);
        // Try next video if current one fails
        this.playNextVideo();
      });
    }
  }

  playNextVideo() {
    this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videos.length;
    this.playVideo(this.currentVideoIndex);
  }
}

// Initialize the idle screen manager when the page loads
window.addEventListener('load', () => {
  window.idleScreenManager = new IdleScreenManager();
});
