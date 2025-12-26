console.log("GHOST-OS Initialized");
// Function to navigate to another page only if the word matches
function goToPage() {
  const inputText = document.getElementById('textInput').value.trim().toLowerCase();
  
  // Define the correct word/phrase (case-insensitive)
  const correctPhrase = "GHOSTOS".toLowerCase();

  // Check if input matches the phrase
  if (inputText === correctPhrase) {
    // Redirect to another page (replace 'newpage.html' with your actual page)
    window.location.href = "index.html";
  } else {
    // Show an alert if the word is incorrect
    alert("PASSWORD INCORRECT, ACCESS DENIED");
  }
}
