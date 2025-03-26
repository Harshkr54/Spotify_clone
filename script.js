// Fetch songs from the server
async function getSongs() {
  try {
    let a = await fetch("http://127.0.0.1:5500/songs/");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
      const element = as[index];
      if (element.href.endsWith(".mp3")) {
        songs.push(element.href.split("/songs/")[1]);
      }
    }
    return songs;
  } catch (error) {
    console.error("Error fetching songs:", error);
    return [];
  }
}

// Update now playing info
function updateNowPlayingInfo(
  songName,
  artistName = "Unknown",
  imageUrl = "/asset/music.svg"
) {
  const aboutMusic = document.querySelector(".About_music");
  aboutMusic.querySelector("img").src = imageUrl;
  aboutMusic.querySelector(".music_name p:first-child").textContent = songName;
  aboutMusic.querySelector(".music_name p:last-child").textContent = artistName;
}

// Main function to initialize the player
async function main() {
  let songs = await getSongs();

  if (songs.length === 0) {
    console.error("No songs found.");
    return;
  }

  // Populate playlist
  let songUL = document.querySelector(".Artist_content ul");
  songUL.innerHTML = ""; // Clear existing items

  songs.forEach((song, index) => {
    const songName = song
      .replaceAll("%20", " ")
      .replaceAll("PagalWorld.mp3", "")
      .replaceAll("-", " ");
    songUL.innerHTML += `
      <li data-index="${index}">
        <img src="/asset/music.svg" alt="music" width="30" height="30">
        <div class="info">
          <div class="songName">${songName}</div>
          <div class="songArtist">Unknown</div>
        </div>
        <div class="playNow">
          <img src="/asset/play_btn.svg" alt="play_button">
        </div>
      </li>
    `;
  });

  let currentSongIndex = 0;
  const audioElement = new Audio();
  let isPlaying = false;

  // Volume Slider
  const volumeSlider = document.querySelector(".volume-slider");
  volumeSlider.addEventListener("input", () => {
    const value = volumeSlider.value;
    volumeSlider.style.setProperty("--slider-progress", `${value}%`);
    audioElement.volume = value / 100;
  });

  // Play/Pause Button
  const playButton = document.querySelector(".seekBar_btn button:nth-child(3)");
  playButton.addEventListener("click", togglePlayPause);

  function togglePlayPause() {
    if (isPlaying) {
      audioElement.pause();
      playButton.innerHTML = '<img src="asset/seek_play.svg" alt="Play">';
    } else {
      if (!audioElement.src) {
        loadSong(currentSongIndex);
      }
      audioElement
        .play()
        .then(() => {
          playButton.innerHTML = '<img src="asset/pause.svg" alt="Pause">';
          highlightCurrentSong();
        })
        .catch((error) => {
          console.error("Playback failed:", error);
        });
    }
    isPlaying = !isPlaying;
  }

  // Load song function
  function loadSong(index) {
    currentSongIndex = index;
    const song = songs[index];
    const songName = song
      .replaceAll("%20", " ")
      .replaceAll("PagalWorld.mp3", "")
      .replaceAll("-", " ");
    audioElement.src = `http://127.0.0.1:5500/songs/${song}`;

    // Update now playing info
    updateNowPlayingInfo(songName);

    highlightCurrentSong();
  }

  // Highlight current song in playlist
  function highlightCurrentSong() {
    document.querySelectorAll(".Artist_content li").forEach((li) => {
      li.style.backgroundColor =
        li.dataset.index == currentSongIndex ? "#181830" : "";
    });
  }

  // Seek Bar
  const seekBar = document.querySelector(".seekTime input");
  const startTime = document.querySelector(".starttime");
  const endTime = document.querySelector(".endtime");

  audioElement.addEventListener("timeupdate", () => {
    const currentTime = audioElement.currentTime;
    const duration = audioElement.duration || 1; // Avoid division by zero

    const progressPercent = (currentTime / duration) * 100;
    seekBar.value = progressPercent;
    seekBar.style.background = `linear-gradient(to right, #4caf50 ${progressPercent}%, #ddd ${progressPercent}%)`;

    startTime.textContent = formatTime(currentTime);
    if (duration) {
      endTime.textContent = formatTime(duration);
    }
  });

  seekBar.addEventListener("input", () => {
    const seekTime = (seekBar.value / 100) * (audioElement.duration || 0);
    audioElement.currentTime = seekTime;
  });

  // Time formatting
  function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // Next/Previous Buttons
  const nextButton = document.querySelector(".seekBar_btn button:nth-child(4)");
  const previousButton = document.querySelector(
    ".seekBar_btn button:nth-child(2)"
  );

  nextButton.addEventListener("click", () => {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadAndPlay();
  });

  previousButton.addEventListener("click", () => {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadAndPlay();
  });

  function loadAndPlay() {
    loadSong(currentSongIndex);
    if (isPlaying) {
      audioElement
        .play()
        .then(() => highlightCurrentSong())
        .catch((error) => console.error("Playback failed:", error));
    }
  }

  // Playlist item clicks
  document.querySelectorAll(".playNow").forEach((button) => {
    button.addEventListener("click", function () {
      const li = this.closest("li");
      currentSongIndex = parseInt(li.dataset.index);
      const songName = li.querySelector(".songName").textContent;
      const artistName = li.querySelector(".songArtist").textContent;

      updateNowPlayingInfo(songName, artistName);
      loadSong(currentSongIndex);

      if (!isPlaying) {
        togglePlayPause();
      } else {
        audioElement
          .play()
          .then(() => highlightCurrentSong())
          .catch((error) => console.error("Playback failed:", error));
      }
    });
  });

  // Card clicks
  document.querySelectorAll(".card").forEach((card, index) => {
    card.addEventListener("click", () => {
      if (index < songs.length) {
        currentSongIndex = index;
        const song = songs[index];
        const songName = song
          .replaceAll("%20", " ")
          .replaceAll("PagalWorld.mp3", "")
          .replaceAll("-", " ");

        updateNowPlayingInfo(songName);
        loadSong(currentSongIndex);

        if (!isPlaying) {
          togglePlayPause();
        } else {
          audioElement
            .play()
            .then(() => highlightCurrentSong())
            .catch((error) => console.error("Playback failed:", error));
        }
      }
    });
  });

  // Shuffle and Repeat
  const shuffleButton = document.querySelector(
    ".seekBar_btn button:nth-child(1)"
  );
  const repeatButton = document.querySelector(
    ".seekBar_btn button:nth-child(5)"
  );

  let isShuffle = false;
  let isRepeat = false;

  shuffleButton.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleButton.classList.toggle("active", isShuffle);
  });

  repeatButton.addEventListener("click", () => {
    isRepeat = !isRepeat;
    repeatButton.classList.toggle("active", isRepeat);
  });

  // Handle song ending
  audioElement.addEventListener("ended", () => {
    if (isRepeat) {
      audioElement.currentTime = 0;
      audioElement.play();
    } else if (isShuffle) {
      currentSongIndex = Math.floor(Math.random() * songs.length);
      loadAndPlay();
    } else {
      nextButton.click();
    }
  });

  // Fullscreen Button
  const fullscreenButton = document.querySelector(
    ".volume_more button:last-child"
  );
  fullscreenButton.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    const library = document.querySelector(".library");
    library.classList.toggle("active");
    document.querySelector(".close-btn").style.display =
      library.classList.contains("active") ? "block" : "none";
  });

  document.querySelector(".close-btn").addEventListener("click", () => {
    document.querySelector(".library").classList.remove("active");
    document.querySelector(".close-btn").style.display = "none";
  });

  const socialLinks = document.querySelectorAll(".social a");
  const socialContainer = document.querySelector(".social");

  socialContainer.addEventListener("mousemove", (e) => {
    for (const link of socialLinks) {
      const rect = link.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      link.style.setProperty("--mouse-x", `${x}px`);
      link.style.setProperty("--mouse-y", `${y}px`);
    }
  });

  const searchBtn = document.getElementById("search_btn");
  const searchInput = document.querySelector(".search-input");

  searchBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    searchInput.classList.toggle("active");

    if (searchInput.classList.contains("active")) {
      searchInput.focus();
    }
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".search-wrapper") &&
      searchInput.classList.contains("active")
    ) {
      searchInput.classList.remove("active");
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", main);
