export const playRingtone = (soundFilePath, stopRef) => {
  return new Promise((resolve, reject) => {
    const ringtone = new Audio(soundFilePath);
    ringtone.loop = true;

    ringtone
      .play()
      .then(() => {
        const interval = setInterval(() => {
          if (stopRef.current) {
            ringtone.pause();
            ringtone.currentTime = 0;
            clearInterval(interval);
            resolve("Ringtone stopped manually.");
          }
        }, 100);

        // Tự động dừng sau 60 giây
        setTimeout(() => {
          if (!stopRef.current) {
            ringtone.pause();
            ringtone.currentTime = 0;
            clearInterval(interval);
            resolve("Ringtone stopped after 60 seconds.");
          }
        }, 60000);
      })
      .catch((error) => reject(`Error playing sound: ${error.message}`));
  });
};
