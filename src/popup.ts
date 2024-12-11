const closeButton = document.getElementById(
  "close-ext-menu"
) as HTMLButtonElement;
const settingsButton = document.getElementById("settings") as HTMLButtonElement;

closeButton.addEventListener("click", () => {
  // CLose the extension popup
  window.close();
});
